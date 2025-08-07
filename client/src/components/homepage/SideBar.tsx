import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui-kit/Sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui-kit/Collapsible";
import { ListChecks, Folder, ChevronDown, Plus, Pin, PinOff, Trash2 } from "lucide-react";
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui-kit/Tooltip";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, MYTASKS_PATH } from "@/routes/routeConfig";
import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
import { ProjectDialog } from "@/components/projectspage/ProjectDialog";
import { withToast } from "@/utils/toastUtils";
import logger from "@/utils/logger";

// Sidebar props interface - no longer needs any props!
export interface HomeSideBarProps {}

// Sidebar mode: true (fixed) or false (auto)
const SIDEBAR_MODE_KEY = 'sidebarIsFixed';
function getInitialSidebarIsFixed(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SIDEBAR_MODE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  }
  return false;
}

export function HomeSideBar() {
  logger.debug("Rendering HomeSideBar component");
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarIsFixed, setSidebarIsFixed] = useState<boolean>(getInitialSidebarIsFixed());
  const [expanded, setExpanded] = useState<boolean>(sidebarIsFixed);
  const [showText, setShowText] = useState(sidebarIsFixed); // show text immediately if fixed
  const isFirstRender = useRef(true);
  const [mouseCooldown, setMouseCooldown] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const { projects, loading, fetchProjectRoles, fetchProjects, createProject } = useProjectStore();
  const { taskViews, fetchTaskViews } = useTaskViewStore();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjectRoles();
  }, [fetchProjectRoles]);

  // Fetch task views on mount
  useEffect(() => {
    fetchTaskViews();
  }, [fetchTaskViews]);

  // Handle project creation
  const handleProjectSubmit = async (project: { name: string; slug: string; description: string }) => {
    await withToast(
      async () => {
        const newProject = await createProject(project);
        setProjectDialogOpen(false);
        if (newProject && newProject.slug) {
          const currentHash = location.hash;
          navigate(`/projects/${newProject.slug}${currentHash}`);
        }
      },
      {
        success: 'Project created successfully!',
        error: 'Failed to create project.'
      }
    );
  };

  // Navigation handlers
  const isTasksActive = location.pathname.startsWith(MYTASKS_PATH) && !location.search.includes('view=');
  const isTaskViewActive = (viewName: string) => {
    const dashedName = viewName.replace(/\s+/g, '-');
    return location.pathname.startsWith(MYTASKS_PATH) && location.search.includes(`view=${dashedName}`);
  };
  const isProjectActive = (projectId: string) => {
    // Check if current URL matches this project's slug (ignore hash for active state)
    const project = projects.find(p => p.id === projectId);
    return project ? location.pathname === `${PROJECTS_PATH}/${project.slug}` : false;
  };

  // Handle delayed text display after expansion animation
  useEffect(() => {
    if (expanded) {
      if (isFirstRender.current) {
        const timer = setTimeout(() => {
          setShowText(true);
        }, 300);
        isFirstRender.current = false;
      } else {
        const timer = setTimeout(() => {
          setShowText(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      setShowText(false);
    }
  }, [expanded]);

  // Prevent sidebar expand/collapse when dialog is open (if onAddProject is provided, assume dialog is managed by parent)
  const handleSidebarMouseEnter = () => {
    if (!sidebarIsFixed && !mouseCooldown) setExpanded(true);
  };
  const handleSidebarMouseLeave = () => {
    if (!sidebarIsFixed && !mouseCooldown) setExpanded(false);
  };

  const toggleSidebarIsFixed = () => {
    const newIsFixed = !sidebarIsFixed;
    if (!newIsFixed) {
      setExpanded(false); // Collapse immediately when unpinning
      setMouseCooldown(true);
      setTimeout(() => setMouseCooldown(false), 300);
    }
    setSidebarIsFixed(newIsFixed);
    localStorage.setItem(SIDEBAR_MODE_KEY, String(newIsFixed));
    if (newIsFixed) setExpanded(true);
  };

  return (
    <SidebarProvider defaultOpen={true} open={expanded} onOpenChange={setExpanded}>
      <Sidebar
        collapsible="icon"
        className="h-full pt-3 p-3 pl-2 relative max-w-[14rem]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <SidebarMenu className="gap-2 bg-white-black">
          <TasksMenuItem 
            showText={showText}
            isTasksActive={isTasksActive}
            handleTasksClick={() => navigate(MYTASKS_PATH)}
            taskViews={taskViews}
            navigate={navigate}
            location={location}
            isTaskViewActive={isTaskViewActive}
          />
          <ProjectsMenuItem
            showText={showText}
            isProjectActive={isProjectActive}
            setExpanded={setExpanded}
            onAddProject={() => setProjectDialogOpen(true)}
            projects={projects}
            loading={loading}
          />
        </SidebarMenu>
        {/* Pin/Unpin button at bottom right: only show when expanded */}
        {expanded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  onClick={toggleSidebarIsFixed}
                  className="absolute bottom-2 right-2 rounded-full p-2 flex items-center justify-center hover:bg-secondary transition bg-transparent cursor-pointer"
                  aria-label={sidebarIsFixed ? 'Unpin sidebar' : 'Pin sidebar'}
                  tabIndex={0}
                  role="button"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebarIsFixed(); } }}
                >
                  {sidebarIsFixed ? (
                    <Pin className="w-4 h-4 text-primary-purple" />
                  ) : (
                    <PinOff className="w-4 h-4 text-primary-purple" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                {sidebarIsFixed ? 'Unpin sidebar' : 'Pin sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {/* Project Dialog */}
        {projectDialogOpen && (
          <ProjectDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            onSubmit={handleProjectSubmit}
          />
        )}
      </Sidebar>
    </SidebarProvider>
  );
}


function TasksMenuItem({ 
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
    if (activeView && (!currentSelectedTaskView || currentSelectedTaskView.id !== activeView.id)) {
      setCurrentSelectedTaskView(activeView);
      setCurrentDisplayViewConfig(activeView.viewConfig);
    } else if (!activeView && currentSelectedTaskView) {
      setCurrentSelectedTaskView(null);
      setCurrentDisplayViewConfig(defaultDisplayViewConfig);
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
          handleTasksClick();
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
                    navigate(`/mytasks?view=${view.name.replace(/\s+/g, '-')}`);
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

// Projects menu item component
function ProjectsMenuItem({ 
  showText,
  isProjectActive,
  setExpanded,
  onAddProject,
  projects,
  loading
}: { 
  showText: boolean; 
  isProjectActive: (projectId: string) => boolean;
  setExpanded: (v: boolean) => void;
  onAddProject?: () => void;
  projects: { id: string; name: string; slug: string }[];
  loading: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddProject && onAddProject();
  };

  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen={true} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="relative flex items-center min-w-0 mb-1 group cursor-pointer">
            <Folder className="w-5 h-5 mr-1 flex-shrink-0" />
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
                    className="inline-flex items-center justify-center rounded-full cursor-pointer hover:bg-primary-purple/70 dark:hover:bg-primary-purple p-1 z-[1]"
                  >
                    <Plus className="w-4 h-4" />
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0"
                    aria-hidden="true"
                  />
                </span>
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="gap-[6px]">
            {showText && loading && (
              <SidebarMenuSubItem>
                <SidebarMenuButton className="pl-4 cursor-default">
                  Loading...
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            )}
            {showText && !loading && projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuButton
                  className="pl-3 cursor-pointer"
                  isActive={isProjectActive(project.id)}
                  onClick={() => {
                    const currentHash = location.hash;
                    navigate(`${PROJECTS_PATH}/${project.slug}${currentHash}`);
                  }}
                >
                  {project.name}
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

