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
import { useState, useEffect } from "react";
import { MYTASKS_PATH } from "@/routes/routeConfig";
import logger from "@/utils/logger";

export function TasksMenuItem({ 
  showText,
  isTasksActive,
  handleTasksClick,
  taskViews,
  navigate,
  location,
  isTaskViewActive
}: { 
  showText: boolean; 
  isTasksActive: boolean;
  handleTasksClick: () => void;
  taskViews: any[];
  navigate: any;
  location: any;
  isTaskViewActive: (viewId: string) => boolean;
}) {
  const { setCurrentSelectedTaskView, currentSelectedTaskView, defaultDisplayViewConfig,
    setCurrentDisplayViewConfig, deleteTaskView } = useTaskViewStore();
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);

  // Automatically set currentSelectedTaskView based on active view in URL
  useEffect(() => {
    // Find the active view by matching the URL
    const activeView = taskViews.find(view => isTaskViewActive(view.name));
    logger.debug("Active view from URL:", activeView);
    
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
        isActive={isTasksActive}
        onClick={() => {
          setCurrentSelectedTaskView(null);
          // Preserve current hash (view mode) when navigating back to My Tasks without adding to history
          navigate({ pathname: MYTASKS_PATH, hash: location.hash }, { replace: true });
        }}
      >
        <ListChecks className="w-5 h-5 mr-1 flex-shrink-0" />
        {showText && <span>My Tasks</span>}
      </SidebarMenuButton>
      {/* Task views - always visible when showText is true */}
      {showText && (
        <SidebarMenuSub className="gap-[6px]">
          {taskViews.length === 0 && (
            <SidebarMenuSubItem>
              <SidebarMenuButton className="pl-4 cursor-default text-muted-foreground">
                No saved views
              </SidebarMenuButton>
            </SidebarMenuSubItem>
          )}
          {taskViews.map((view) => (
            <SidebarMenuSubItem key={view.id}>
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setHoveredViewId(view.id)}
                onMouseLeave={() => setHoveredViewId(null)}
              >
                <SidebarMenuButton
                  className="pl-3 cursor-pointer flex-1 min-w-0"
                  isActive={isTaskViewActive(view.name)}
                  onClick={() => {
                    setCurrentSelectedTaskView(view);
                    // Keep current view mode (hash) when switching saved views; do not spam history
                    navigate({ 
                      pathname: MYTASKS_PATH, 
                      search: `?view=${view.name.replace(/\s+/g, '-')}`,
                      hash: location.hash
                    }, { replace: true });
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
