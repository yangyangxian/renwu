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
import { ListChecks, Folder, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, TASKS_PATH } from "@/routes/routeConfig";
import { useState, useEffect } from "react";

// Mock data - replace with actual project fetching logic
const mockProjects = [
  { id: "1", name: "Project Alpha" },
  { id: "2", name: "Project Beta" },
  { id: "3", name: "Project Gamma" },
  { id: "4", name: "Project Delta" },
  { id: "5", name: "Project Epsilon" },
  { id: "6", name: "Project Zeta" },
  { id: "7", name: "Project Eta" },
  { id: "8", name: "Project Theta" },
  { id: "9", name: "Project Iota" },
  { id: "10", name: "Project Kappa" },
  { id: "11", name: "Project Lambda" },
  { id: "12", name: "Project Mu" },
  { id: "13", name: "Project Nu" },
  { id: "14", name: "Project Xi" },
  { id: "15", name: "Project Omicron" },
  { id: "16", name: "Project Pi" },
  { id: "17", name: "Project Rho" },
  { id: "18", name: "Project Sigma" },
  { id: "19", name: "Project Tau" },
  { id: "20", name: "Project Upsilon" },
];

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
  isProjectActive 
}: { 
  showText: boolean; 
  isProjectActive: (projectId: string) => boolean;
}) {
  const navigate = useNavigate();

  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen={false} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="relative flex items-center w-full min-w-0 group cursor-pointer">
            <Folder className="w-5 h-5 mr-2 flex-shrink-0" />
            {showText && (
              <>
                <span className="truncate transition-all duration-200">
                  Projects
                </span>
                <span className="flex-1" />
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2 absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {showText && mockProjects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuButton
                  className="pl-8 cursor-pointer"
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

export function HomeSideBar({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
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

  return (
    <SidebarProvider defaultOpen={true} open={expanded} onOpenChange={setExpanded}>
      <Sidebar
        collapsible="icon"
        className="transition-all duration-300 h-full p-2 pt-3"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <SidebarMenu className="bg-white-black">
          <TaskMenuItem isActive={isTasksActive} onClick={handleTasksClick} showText={showText} />
          <ProjectsMenuItem showText={showText} isProjectActive={isProjectActive} />
        </SidebarMenu>
      </Sidebar>
    </SidebarProvider>
  );
}
