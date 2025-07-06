
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

// Example: Replace this with your actual project fetching logic or props
const projects = [
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

export function HomeSideBar({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true} open={expanded} onOpenChange={setExpanded}>
      <Sidebar
        collapsible="icon"
        className="transition-all duration-200 overflow-y-auto bg-white dark:bg-muted shadow-md flex flex-col items-center gap-2 p-2 pt-3"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <SidebarMenu className="bg-white flex-1 min-h-0 overflow-y-auto flex flex-col">
          {/* Fix: Move Collapsible outside of SidebarMenuItem to avoid rendering issues */}
          <SidebarMenuItem key="tasks-menu-item">
            <SidebarMenuButton
              isActive={location.pathname.startsWith(TASKS_PATH)}
              onClick={() => navigate(TASKS_PATH)}
              className="flex items-center"
            >
              <ListChecks className="w-5 h-5 mr-2" />
              <span className="truncate">My Tasks</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem key="projects-menu-item" className="bg-white">
            <Collapsible defaultOpen={false} className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="relative flex items-center w-full min-w-0 group"
                >
                  <Folder className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span
                    className="truncate transition-all duration-200"
                    style={{ maxWidth: expanded ? '120px' : '0', opacity: expanded ? 1 : 0 }}
                  >
                    {"Projects"}
                  </span>
                  <span className="flex-1" />
                  {expanded && (
                    <ChevronDown
                      className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2 absolute right-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {projects.map((project) => (
                    <SidebarMenuSubItem key={project.id}>
                      <SidebarMenuButton
                        className="pl-8"
                        isActive={location.pathname === `${PROJECTS_PATH}/${project.id}`}
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

        </SidebarMenu>
      </Sidebar>
    </SidebarProvider>
  );
}
