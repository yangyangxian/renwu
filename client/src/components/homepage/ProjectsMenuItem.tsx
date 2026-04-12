import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui-kit/Sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui-kit/Collapsible";
import { Folder, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Location, useNavigate } from "react-router-dom";
import { PROJECTS_PATH } from "@/routes/routeConfig";
import React, { useCallback, useState } from "react";
import { ProjectResDto, TaskViewResDto } from "@fullstack/common";
import { Skeleton } from "../ui-kit/Skeleton";
import { useTaskViewStore, createProjectTaskViewConfig } from "@/stores/useTaskViewStore";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-kit/Tooltip";
import { useAuth } from "@/providers/AuthProvider";

export function ProjectsMenuItem({ 
  showText,
  onAddProject,
  projects,
  taskViews,
  loading,
  location
}: { 
  showText: boolean; 
  onAddProject?: () => void;
  projects: ProjectResDto[];
  taskViews: TaskViewResDto[];
  loading: boolean;
  location: Location;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentDisplayViewConfig,
    currentSelectedTaskView,
    deleteTaskView,
    setCurrentDisplayViewConfig,
    setCurrentSelectedTaskView,
  } = useTaskViewStore();
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);
  const pathname = location.pathname;

  const isProjectActive = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return false;
    }

    const params = new URLSearchParams(location.search);
    return pathname === `${PROJECTS_PATH}/${project.slug}` && !params.get('view');
  }, [location.search, pathname, projects]);

  const isProjectViewActive = useCallback((projectSlug: string, viewName: string) => {
    const params = new URLSearchParams(location.search);
    return pathname === `${PROJECTS_PATH}/${projectSlug}` && params.get('view') === viewName.replace(/\s+/g, '-');
  }, [location.search, pathname]);

  const handleAddProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddProject && onAddProject();
  };

  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen={true} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="relative flex items-center min-w-0 mb-1 group cursor-pointer">
            <Folder className="w-5 h-5 mr-1 shrink-0" />
            {showText && (
              <>
                <span>
                  Projects
                </span>
                <span className="flex-1" />
                <span className="flex items-center gap-1">
                  <span
                    role="button"
                    aria-label="Add Project"
                    tabIndex={0}
                    onClick={handleAddProject}
                    onMouseDown={e => e.stopPropagation()}
                    onFocus={e => e.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-md cursor-pointer hover:bg-primary-purple/70 dark:hover:bg-primary-purple p-1 z-1"
                  >
                    <Plus className="w-4 h-4 hover:text-white" />
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0"
                    aria-hidden="true"
                  />
                </span>
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="gap-1.5">
            {loading && 
            <>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
            </>}
            {showText && !loading && projects.map((project) => {
              const projectViews = taskViews.filter((view) => view.projectId === project.id);

              return (
              <SidebarMenuSubItem key={project.id}>
                <div className="space-y-1">
                  <SidebarMenuButton
                    className="pl-4 cursor-pointer"
                    isActive={isProjectActive(project.id)}
                    onClick={() => {
                      const currentHash = location.hash;
                      navigate(`${PROJECTS_PATH}/${project.slug}${currentHash}`);
                      setCurrentSelectedTaskView(null);
                      setCurrentDisplayViewConfig(
                        createProjectTaskViewConfig(project.id, {
                          viewMode: currentDisplayViewConfig.viewMode,
                        })
                      );
                    }}
                  >
                    {project.name}
                  </SidebarMenuButton>

                  {projectViews.length > 0 && (
                    <div className="ml-3 space-y-1">
                      {projectViews.map((view) => (
                        <div
                          key={view.id}
                          className="relative group flex items-center"
                          onMouseEnter={() => setHoveredViewId(view.id)}
                          onMouseLeave={() => setHoveredViewId(null)}
                        >
                          <SidebarMenuButton
                            className="pl-6 h-7 cursor-pointer flex-1 min-w-0"
                            isActive={isProjectViewActive(project.slug, view.name)}
                            onClick={() => {
                              const encodedName = encodeURIComponent(view.name.replace(/\s+/g, '-'));
                              navigate(`${PROJECTS_PATH}/${project.slug}?view=${encodedName}`);
                              setCurrentSelectedTaskView(view);
                              setCurrentDisplayViewConfig(createProjectTaskViewConfig(project.id, view.viewConfig));
                            }}
                          >
                            <span className="truncate text-sm">{view.name}</span>
                          </SidebarMenuButton>

                          {hoveredViewId === view.id && user?.id === view.userId && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                                      tabIndex={0}
                                      aria-label="Delete project view"
                                      onClick={(event) => {
                                        event.stopPropagation();
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
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setDeleteDialogOpenId(null);
                                  }
                                }}
                                title="Delete Project View?"
                                description="Are you sure you want to delete this project view? This action cannot be undone."
                                onConfirm={async () => {
                                  try {
                                    const wasSelected = currentSelectedTaskView?.id === view.id;
                                    await deleteTaskView(view.id);
                                    if (wasSelected) {
                                      setCurrentSelectedTaskView(null);
                                      setCurrentDisplayViewConfig(
                                        createProjectTaskViewConfig(project.id, {
                                          viewMode: currentDisplayViewConfig.viewMode,
                                        })
                                      );
                                      navigate(`${PROJECTS_PATH}/${project.slug}`);
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
                      ))}
                    </div>
                  )}
                </div>
              </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
