import {
  Sidebar,
  SidebarMenu,
  SidebarProvider,
} from "@/components/ui-kit/Sidebar";
import { Pin, PinOff } from "lucide-react";
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui-kit/Tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, MYTASKS_PATH } from "@/routes/routeConfig";
import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
import { ProjectDialog } from "@/components/projectspage/AddProjectDialog";
import { withToast } from "@/utils/toastUtils";
import logger from "@/utils/logger";
import { TasksMenuItem } from "./TasksMenuItem";
import { ProjectsMenuItem } from "./ProjectsMenuItem";

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
          navigate(`${PROJECTS_PATH}/${newProject.slug}${currentHash}`);
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

