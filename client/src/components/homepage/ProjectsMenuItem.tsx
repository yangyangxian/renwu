import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui-kit/Sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui-kit/Collapsible";
import { Folder, ChevronDown, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH } from "@/routes/routeConfig";
import React, { useCallback } from "react";
import { ProjectResDto } from "@fullstack/common";
import { Skeleton } from "../ui-kit/Skeleton";

export function ProjectsMenuItem({ 
  showText,
  setExpanded,
  onAddProject,
  projects,
  loading,
  location
}: { 
  showText: boolean; 
  setExpanded: (v: boolean) => void;
  onAddProject?: () => void;
  projects: ProjectResDto[];
  loading: boolean;
  location: any;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isProjectActive = useCallback((projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? pathname === `${PROJECTS_PATH}/${project.slug}` : false;
  }, [pathname, projects]);

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
                    className="inline-flex items-center justify-center rounded-md cursor-pointer hover:bg-primary-purple/70 dark:hover:bg-primary-purple p-1 z-[1]"
                  >
                    <Plus className="w-4 h-4 hover:text-white" />
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
            {loading && 
            <>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
            </>}
            {showText && !loading && projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuButton
                  className="pl-4 cursor-pointer"
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
