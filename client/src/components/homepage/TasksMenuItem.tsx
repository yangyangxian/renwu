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
import { useState, useCallback } from "react";
import { MYTASKS_PATH } from "@/routes/routeConfig";
import { Skeleton } from "../ui-kit/Skeleton";
import { TaskViewResDto } from "@fullstack/common";
import { Location, NavigateFunction } from "react-router-dom";
import { getTaskViewModeMeta } from "@/lib/taskViewModeMeta";

export function TasksMenuItem({ 
  showText,
  taskViews,
  navigate,
  location,
  loading
}: { 
  showText: boolean; 
  taskViews: TaskViewResDto[];
  navigate: NavigateFunction;
  location: Location;
  loading: boolean;
}) {
  const {
    currentSelectedTaskView,
    deleteTaskView,
  } = useTaskViewStore();
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);

  const isTasksActive = useCallback(() => location.pathname.startsWith(MYTASKS_PATH) && !location.search.includes('view='), [location]);

  const isTaskViewActive = useCallback((viewName: string) => {
    const dashedName = viewName.replace(/\s+/g, '-');
    const params = new URLSearchParams(location.search);
    // params.get('view') is automatically decoded by the browser
    return location.pathname.startsWith(MYTASKS_PATH) && params.get('view') === dashedName;
  }, [location]);

  return (
    <SidebarMenuItem>
      {/* Main Personal Tasks button - always visible */}
      <SidebarMenuButton 
        className="relative flex items-center min-w-0 mb-1 cursor-pointer"
        isActive={isTasksActive()}
        onClick={() => {
          navigate(MYTASKS_PATH);
        }}
      >
        <ListChecks className="w-5 h-5 mr-1 shrink-0" />
        {showText && <span>Personal Tasks</span>}
      </SidebarMenuButton>
      {/* Task views - always visible when showText is true */}
        {showText && (
        <SidebarMenuSub className="gap-1.5">
          { loading && 
          <>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
          </>}
          {taskViews.map((view) => (
            <SidebarMenuSubItem key={view.id}>
              {(() => {
                const { icon: ViewModeIcon } = getTaskViewModeMeta(view.viewConfig.viewMode);

                return (
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setHoveredViewId(view.id)}
                onMouseLeave={() => setHoveredViewId(null)}
              >
                <SidebarMenuButton
                  className="pl-4 cursor-pointer flex-1 min-w-0"
                  isActive={isTaskViewActive(view.name)}
                  onClick={() => {
                    const dashedName = view.name.replace(/\s+/g, '-');
                    const encoded = encodeURIComponent(dashedName);
                    navigate(`${MYTASKS_PATH}?view=${encoded}`);
                  }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <ViewModeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{view.name}</span>
                  </span>
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
                              const dashedName = nextView.name.replace(/\s+/g, '-');
                              const encoded = encodeURIComponent(dashedName);
                              navigate(`${MYTASKS_PATH}?view=${encoded}`);
                            } else {
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
                );
              })()}
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
