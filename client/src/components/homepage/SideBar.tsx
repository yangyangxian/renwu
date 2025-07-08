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
import { ListChecks, Folder, ChevronDown, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, TASKS_PATH } from "@/routes/routeConfig";
import { useState, useEffect } from "react";

// Task menu item component
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
        <ListChecks className="w-5 h-5 mr-2 flex-shrink-0" />
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
    setExpanded(false);
    onAddProject && onAddProject();
  };

  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen={false} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="relative flex items-center w-full min-w-0 mb-1 group cursor-pointer">
            <Folder className="w-5 h-5 mr-2 flex-shrink-0" />
            {showText && (
              <>
                <span className="truncate transition-all duration-200">
                  Projects
                </span>
                <span className="flex-1" />
                <span className="flex items-center gap-1 mr-1">
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
                  className="pl-5 cursor-pointer"
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

export function HomeSideBar({ expanded, setExpanded, onAddProject, projects }: { expanded: boolean; setExpanded: (v: boolean) => void; onAddProject?: () => void; projects: { id: string; name: string }[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showText, setShowText] = useState(false);

  // Navigation handlers
  const handleTasksClick = () => navigate(TASKS_PATH);
  const isTasksActive = location.pathname.startsWith(TASKS_PATH);
  const isProjectActive = (projectId: string) => location.pathname === `${PROJECTS_PATH}/${projectId}`;

  // Handle delayed text display after expansion animation
  useEffect(() => {
    if (expanded) {
      // Delay showing text until after the sidebar expansion animation (400ms) completes
      const timer = setTimeout(() => {
        setShowText(true);
      }, 300); 
      return () => clearTimeout(timer);
    } else {
      // Hide text immediately when collapsing
      setShowText(false);
    }
  }, [expanded]);

  // Prevent sidebar expand/collapse when dialog is open (if onAddProject is provided, assume dialog is managed by parent)
  const handleSidebarMouseEnter = () => {
    setExpanded(true);
  };
  const handleSidebarMouseLeave = () => {
    setExpanded(false);
  };


  return (
    <SidebarProvider defaultOpen={true} open={expanded} onOpenChange={setExpanded}>
      <Sidebar
        collapsible="icon"
        className="transition-all duration-300 h-full p-2 pt-3"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <SidebarMenu className="bg-white-black gap-2">
          <TaskMenuItem isActive={isTasksActive} onClick={handleTasksClick} showText={showText} />
          <ProjectsMenuItem
            showText={showText}
            isProjectActive={isProjectActive}
            setExpanded={setExpanded}
            onAddProject={onAddProject}
            projects={projects}
          />
        </SidebarMenu>
      </Sidebar>
    </SidebarProvider>
  );
}
