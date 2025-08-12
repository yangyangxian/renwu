import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui-kit/Sidebar";
import { ListChecks, Trash2 } from "lucide-react";
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui-kit/Tooltip";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { useState, useEffect, useCallback } from "react";
import { MYTASKS_PATH } from "@/routes/routeConfig";
import { logger } from "@/utils/logger";

export function TasksMenuItem({ 
  showText,
  taskViews,
  navigate,
  location
}: { 
  showText: boolean; 
  taskViews: any[];
  navigate: any;
  location: any;
}) {
  const { setCurrentSelectedTaskView, currentSelectedTaskView, defaultDisplayViewConfig,
    setCurrentDisplayViewConfig, deleteTaskView } = useTaskViewStore();
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);

  const isTasksActive = useCallback(() => location.pathname.startsWith(MYTASKS_PATH) && !location.search.includes('view='), [location]);

  const isTaskViewActive = useCallback((viewName: string) => {
    const dashedName = viewName.replace(/\s+/g, '-');
    return location.pathname.startsWith(MYTASKS_PATH) && location.search.includes(`view=${dashedName}`);
  }, [location]);

  // Automatically set currentSelectedTaskView based on active view in URL
  useEffect(() => {
    // Find the active view by matching the URL
    const activeView = taskViews.find(view => isTaskViewActive(view.name));
    
    if (activeView && (!currentSelectedTaskView || currentSelectedTaskView.id !== activeView.id)) {
      setCurrentSelectedTaskView(activeView);
      setCurrentDisplayViewConfig(activeView.viewConfig);
      logger.debug("set setCurrentDisplayViewConfig:", activeView.viewConfig);
    } else if (!activeView && currentSelectedTaskView) {
      logger.debug("No active view found, resetting currentSelectedTaskView");
      setCurrentSelectedTaskView(null);
      setCurrentDisplayViewConfig(defaultDisplayViewConfig);
      logger.debug("set setCurrentDisplayViewConfig:", defaultDisplayViewConfig);
    }
  }, [location, taskViews, isTaskViewActive, setCurrentSelectedTaskView]);

  return (
    <SidebarMenuItem>
      {/* Main "My Tasks" button - always visible */}
      <SidebarMenuButton 
        className="relative flex items-center min-w-0 mb-1 cursor-pointer"
        isActive={isTasksActive()}
        onClick={() => {
          navigate(MYTASKS_PATH);
          setCurrentSelectedTaskView(null);
          setCurrentDisplayViewConfig(defaultDisplayViewConfig);
        }}
      >
        <ListChecks className="w-5 h-5 mr-1 flex-shrink-0" />
        {showText && <span>My Tasks</span>}
      </SidebarMenuButton>
      {/* Task views - always visible when showText is true */}
      {showText && (
        <SidebarMenuSub className="gap-[6px]">
          {taskViews.map((view) => (
            <SidebarMenuSubItem key={view.id}>
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setHoveredViewId(view.id)}
                onMouseLeave={() => setHoveredViewId(null)}
              >
                <SidebarMenuButton
                  className="pl-4 cursor-pointer flex-1 min-w-0"
                  isActive={isTaskViewActive(view.name)}
                  onClick={() => {
                    navigate(`${MYTASKS_PATH}?view=${view.name.replace(/\s+/g, '-')}`);
                    setCurrentSelectedTaskView(view);
                    setCurrentDisplayViewConfig(view.viewConfig);
                  }}
                >
                  <span className="truncate">{view.name}</span>
                </SidebarMenuButton>
                {/* Delete button: only show for hovered item */}
                {hoveredViewId === view.id && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                            tabIndex={0}
                            aria-label="Delete task view"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteDialogOpenId(view.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Delete view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ConfirmDeleteDialog
                      open={deleteDialogOpenId === view.id}
                      onOpenChange={open => {
                        if (!open) setDeleteDialogOpenId(null);
                      }}
                      title="Delete Task View?"
                      description="Are you sure you want to delete this task view? This action cannot be undone."
                      onConfirm={async () => {
                        try {
                          const wasSelected = currentSelectedTaskView && currentSelectedTaskView.id === view.id;
                          await deleteTaskView(view.id);
                          if (wasSelected) {
                            // Find the next available view (excluding the deleted one)
                            const remainingViews = taskViews.filter(v => v.id !== view.id);
                            if (remainingViews.length > 0) {
                              const nextView = remainingViews[0];
                              setCurrentSelectedTaskView(nextView);
                              navigate(`${MYTASKS_PATH}?view=${nextView.name.replace(/\s+/g, '-')}`);
                            } else {
                              setCurrentSelectedTaskView(null);
                              navigate(MYTASKS_PATH);
                            }
                          }
                        } finally {
                          setDeleteDialogOpenId(null);
                        }
                      }}
                      confirmText="Delete"
                      cancelText="Cancel"
                    />
                  </>
                )}
              </div>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
