import { useParams } from "react-router-dom";
import { useTabHash } from "@/hooks/useTabHash";
import { useEffect, useState } from "react";
import { ProjectOverviewTab } from "@/components/projectspage/OverviewTab";
import { ProjectTasksTab } from "@/components/projectspage/TasksTab";
import { ProjectTeamTab } from "@/components/projectspage/TeamTab";
import { ProjectSettingsTab } from "@/components/projectspage/SettingsTab";
import { LayoutDashboard, List, Users, Settings, Tag } from "lucide-react";
import { ProjectLabelsTab } from "@/components/projectspage/LabelsTab";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { TaskResDto, TaskViewMode } from '@fullstack/common';
import logger from "@/utils/logger";
import { motion } from "framer-motion";
import { HomePageSkeleton } from "@/components/homepage/HomePageSkeleton";

export default function ProjectDetailPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const { currentProject: project, projects, fetchCurrentProject } = useProjectStore();
  const {
    projectTasks: tasks,
    fetchProjectTasks,
  } = useTaskStore();
  const [activeTab, handleTabChange] = useTabHash(
    ['overview', 'tasks', 'labels', 'team', 'settings'],
    'tasks'
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);

  // Local state for task view (list or board)
  const [taskView, setTaskView] = useState<TaskViewMode>(TaskViewMode.BOARD);
  const [loadingCurrentProject, setLoadingCurrentProject] = useState(true);

  // Get projectId from global projects object using slug
  const projectId = projectSlug && projects
    ? Object.values(projects).find(p => p.slug === projectSlug)?.id
    : undefined;

  // Fetch project and tasks together when projectId changes
  useEffect(() => {
    setLoadingCurrentProject(true);
    if (projectId) {
      fetchCurrentProject(projectId)
        .then(async () => {
          await fetchProjectTasks(projectId);
          setLoadingCurrentProject(false);
        })
        .catch(err => {
          logger.error("Failed to fetch project or tasks:", err);
          setLoadingCurrentProject(false);
        });
    }
  }, [projectId, fetchCurrentProject, fetchProjectTasks]);

  if (!projectId || loadingCurrentProject) {
    return <HomePageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
    <div className="h-full w-full flex flex-col mt-1">
      {/* Tabs and Add Task Button in one row */}
      <div className="flex items-center px-2 my-1">
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
            <TabsTrigger value="labels" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <Tag className="w-4 h-4" />
              Labels
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
          view={taskView}
          onViewChange={setTaskView}
          onAddTask={() => {
            setEditingTask(null);
            setIsDialogOpen(true);
          }}
          onTaskClick={taskId => {
            const fullTask = tasks.find(t => t.id === taskId) || null;
            setEditingTask(fullTask);
            setIsDialogOpen(true);
          }}
        />
      )}
      {activeTab === 'labels' && <ProjectLabelsTab />}
      {activeTab === 'team' && <ProjectTeamTab project={project} />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
    </motion.div>
  );
}
