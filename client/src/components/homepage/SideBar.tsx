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
import { ListChecks, Folder, ChevronDown, Plus, Pin, PinOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui-kit/Tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, TASKS_PATH } from "@/routes/routeConfig";
import { useState, useEffect, useRef } from "react";

// Sidebar props interface
export interface HomeSideBarProps {
  onAddProject?: () => void;
  projects: { id: string; name: string }[];
}

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

export function HomeSideBar({ onAddProject, projects }: HomeSideBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarIsFixed, setSidebarIsFixed] = useState<boolean>(getInitialSidebarIsFixed());
  const [expanded, setExpanded] = useState<boolean>(sidebarIsFixed);
  const [showText, setShowText] = useState(sidebarIsFixed); // show text immediately if fixed
  const isFirstRender = useRef(true);

  // Navigation handlers
  const handleTasksClick = () => navigate(TASKS_PATH);
  const isTasksActive = location.pathname.startsWith(TASKS_PATH);
  const isProjectActive = (projectId: string) => location.pathname === `${PROJECTS_PATH}/${projectId}`;

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
    if (!sidebarIsFixed) setExpanded(true);
  };
  const handleSidebarMouseLeave = () => {
    if (!sidebarIsFixed) setExpanded(false);
  };

  const toggleSidebarIsFixed = () => {
    const newIsFixed = !sidebarIsFixed;
    setSidebarIsFixed(newIsFixed);
    localStorage.setItem(SIDEBAR_MODE_KEY, String(newIsFixed));
    if (newIsFixed) setExpanded(true);
    else setExpanded(false);
  };

  return (
    <SidebarProvider defaultOpen={true} open={expanded} onOpenChange={setExpanded}>
      <Sidebar
        collapsible="icon"
        className="transition-all duration-300 h-full p-2 pt-3 pr-3 relative max-w-[14rem]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <SidebarMenu className="gap-2 bg-white-black">
          <TaskMenuItem isActive={isTasksActive} onClick={handleTasksClick} showText={showText} />
          <ProjectsMenuItem
            showText={showText}
            isProjectActive={isProjectActive}
            setExpanded={setExpanded}
            onAddProject={onAddProject}
            projects={projects}
          />
        </SidebarMenu>
        {/* Pin/Unpin button at bottom right: only show when expanded */}
        {expanded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  onClick={toggleSidebarIsFixed}
                  className="absolute bottom-2 right-2 rounded-full p-2 flex items-center justify-center hover:bg-secondary transition bg-transparent cursor-pointer select-none"
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
      </Sidebar>
    </SidebarProvider>
  );
}

function TaskMenuItem({ 
  isActive, 
  onClick, 
  showText 
}: { 
  isActive: boolean; 
  onClick: () => void;
  showText: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onClick}
        className="flex items-center cursor-pointer"
      >
        <ListChecks className="w-5 h-5 mr-1 flex-shrink-0" />
        {showText && <span className="truncate">My Tasks</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Projects menu item component
function ProjectsMenuItem({ 
  showText,
  isProjectActive,
  setExpanded,
  onAddProject,
  projects
}: { 
  showText: boolean; 
  isProjectActive: (projectId: string) => boolean;
  setExpanded: (v: boolean) => void;
  onAddProject?: () => void;
  projects: { id: string; name: string }[];
}) {
  const navigate = useNavigate();

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
            {showText && projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuButton
                  className="pl-4 cursor-pointer"
                  isActive={isProjectActive(project.id)}
                  onClick={() => navigate(`${PROJECTS_PATH}/${project.id}`)}
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

