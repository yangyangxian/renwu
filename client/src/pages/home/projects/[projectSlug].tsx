import { useParams } from "react-router-dom";
import { useTabHash } from "@/hooks/useTabHash";
import { useEffect, useState } from "react";
import { ProjectOverviewTab } from "@/components/projectspage/ProjectOverviewTab";
import { ProjectTasksTab } from "@/components/projectspage/ProjectTasksTab";
import { ProjectTeamTab } from "@/components/projectspage/ProjectTeamTab";
import { ProjectSettingsTab } from "@/components/projectspage/ProjectSettingsTab";
import { LayoutDashboard, List, Users, Settings } from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';
import { Button } from "@/components/ui-kit/Button";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { TaskResDto } from '@fullstack/common';
import logger from "@/utils/logger";

export default function ProjectDetailPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const { currentProject: project, projects, fetchCurrentProject } = useProjectStore();
  const {
    projectTasks: tasks,
    fetchProjectTasks,
  } = useTaskStore();
  const [activeTab, handleTabChange] = useTabHash(
    ['overview', 'tasks', 'team', 'settings'],
    'tasks'
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);

  // Get projectId from global projects object using slug
  const projectId = projectSlug && projects
    ? Object.values(projects).find(p => p.slug === projectSlug)?.id
    : undefined;

  // Fetch project and tasks together when projectId changes
  useEffect(() => {
    if (projectId) {
      logger.info(`Fetching project and tasks for project ID: ${projectId}`);
      fetchCurrentProject(projectId);
      fetchProjectTasks(projectId);
    }
  }, [projectId, fetchCurrentProject, fetchProjectTasks]);

  if (!projectId) {
    return <div className="p-8 text-center text-lg text-red-500">Project not found.</div>;
  }

  return (
    <div className="h-full w-full flex flex-col gap-1">
      {/* Tabs and Add Task Button in one row */}
      <div className="flex items-center px-2 gap-2 my-1">
        <Tabs
          value={activeTab}
          onValueChange={val => handleTabChange(val as typeof activeTab)}
        >
          <TabsList className="bg-white dark:bg-muted">
            <TabsTrigger value="tasks" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <LayoutDashboard className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="overview" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <List className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'tasks' && (
          <Button
            variant="default"
            className="px-3 py-2 flex items-center ml-auto gap-2 text-white bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-transform duration-200 hover:scale-105"
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
          >
            <span className="sr-only">Add Task</span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Task
            </span>
          </Button>
        )}
      </div>
      {isDialogOpen && (
        <TaskDialog
          open={isDialogOpen}
          onOpenChange={(open: boolean) => {
            setIsDialogOpen(open);
            if (!open) setEditingTask(null);
          }}
          title={editingTask ? "Edit Task" : "Add New Task"}
          initialValues={editingTask || (project ? { projectId: project.id } : {})}
        />
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ProjectOverviewTab
          project={project!}
        />
      )}
      {activeTab === 'tasks' && projectSlug && (
        <ProjectTasksTab
          onTaskClick={taskId => {
            const fullTask = tasks.find(t => t.id === taskId) || null;
            setEditingTask(fullTask);
            setIsDialogOpen(true);
          }}
        />
      )}
      {activeTab === 'team' && <ProjectTeamTab project={project} />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
  );
}
