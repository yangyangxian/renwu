import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTabHash } from "@/hooks/useTabHash";
import { useEffect, useState } from "react";
import { ProjectOverviewTab } from "@/components/projectspage/OverviewTab";
import { ProjectTasksTab } from "@/components/projectspage/TasksTab";
import { ProjectTeamTab } from "@/components/projectspage/TeamTab";
import { ProjectSettingsTab } from "@/components/projectspage/SettingsTab";
import { LayoutDashboard, List, Users, Settings, Tag, Table2, Bookmark, ChevronRight } from "lucide-react";
import { ProjectLabelsTab } from "@/components/projectspage/LabelsTab";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { TaskResDto, TaskViewMode } from '@fullstack/common';
import { TaskDateRange } from '@fullstack/common';
import { TaskFilterMenu } from '@/components/taskspage/TaskFilterMenu';
import { Button } from '@/components/ui-kit/Button';
import logger from "@/utils/logger";
import { motion } from "framer-motion";
import { HomePageSkeleton } from "@/components/homepage/HomePageSkeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-kit/Tooltip";
import { SaveTaskViewPopover } from "@/components/taskspage/SaveTaskViewPopover";
import { SaveTaskViewDialog } from "@/components/taskspage/SaveTaskViewDialog";
import { UnsavedChangesIndicator } from "@/components/common/UnsavedChangesIndicator";
import { createProjectTaskViewConfig, sanitizeTaskViewConfigForPersistence, useTaskViewStore } from "@/stores/useTaskViewStore";
import { PROJECTS_PATH } from "@/routes/routeConfig";
import { toast } from "sonner";
import isEqual from "lodash/isEqual";
import { Input } from "@/components/ui-kit/Input";
import { useAuth } from "@/providers/AuthProvider";

export default function ProjectDetailPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProject: project, projects, fetchCurrentProject } = useProjectStore();
  const {
    projectTasks: tasks,
    fetchProjectTasks,
  } = useTaskStore();
  const {
    taskViews,
    currentSelectedTaskView,
    currentDisplayViewConfig,
    setCurrentDisplayViewConfig,
    setCurrentDisplayViewConfigViewMode,
    setCurrentSelectedTaskView,
    updateTaskView,
  } = useTaskViewStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [loadingCurrentProject, setLoadingCurrentProject] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>([]);
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get projectId from global projects object using slug
  const projectId = projectSlug && projects
    ? Object.values(projects).find(p => p.slug === projectSlug)?.id
    : undefined;
  const projectTaskViews = projectId
    ? taskViews.filter((view) => view.projectId === projectId)
    : [];
  const activeViewSlug = new URLSearchParams(location.search).get('view');
  const activeProjectView = projectTaskViews.find(
    (view) => view.name.replace(/\s+/g, '-') === activeViewSlug
  ) ?? (activeViewSlug && currentSelectedTaskView && currentSelectedTaskView.projectId === projectId
    ? projectTaskViews.find((view) => view.id === currentSelectedTaskView.id) ?? null
    : null);
  const [activeTab, handleTabChange] = useTabHash(
    ['overview', 'tasks', 'labels', 'team', 'settings'],
    activeProjectView ? 'tasks' : 'overview'
  );
  const dateRange = currentDisplayViewConfig.dateRange ?? TaskDateRange.ALL_TIME;
  const searchTerm = currentDisplayViewConfig.searchTerm ?? '';
  const selectedLabelId = currentDisplayViewConfig.filterLabelId ?? null;
  const selectedLabelSetId = currentDisplayViewConfig.filterLabelSetId ?? null;
  const isSavedView = !!currentSelectedTaskView && currentSelectedTaskView.projectId === projectId;
  const canRenameActiveView = !!activeProjectView && user?.id === activeProjectView.userId;
  const [isEditingViewName, setIsEditingViewName] = useState(false);
  const [viewNameDraft, setViewNameDraft] = useState('');
  const [isRenamingView, setIsRenamingView] = useState(false);

  const buildViewSlug = (viewName: string) => encodeURIComponent(viewName.replace(/\s+/g, '-'));

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

  useEffect(() => {
    if (!projectId || activeProjectView || currentDisplayViewConfig.projectId === projectId) {
      return;
    }

    setCurrentDisplayViewConfig(
      createProjectTaskViewConfig(projectId, {
        viewMode: currentDisplayViewConfig.viewMode,
      })
    );
  }, [
    projectId,
    activeProjectView,
    currentDisplayViewConfig.projectId,
    currentDisplayViewConfig.viewMode,
    setCurrentDisplayViewConfig,
  ]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (activeProjectView) {
      if (currentSelectedTaskView?.id !== activeProjectView.id) {
        setCurrentSelectedTaskView(activeProjectView);
        setCurrentDisplayViewConfig(createProjectTaskViewConfig(projectId, activeProjectView.viewConfig));
      }
      return;
    }

    if (currentSelectedTaskView) {
      setCurrentSelectedTaskView(null);
      setCurrentDisplayViewConfig(
        createProjectTaskViewConfig(projectId, {
          viewMode: currentDisplayViewConfig.viewMode,
        })
      );
    }
  }, [
    projectId,
    activeProjectView,
    currentSelectedTaskView,
    currentDisplayViewConfig.viewMode,
    setCurrentDisplayViewConfig,
    setCurrentSelectedTaskView,
  ]);

  useEffect(() => {
    if (!projectId || !activeProjectView) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(
      !isEqual(
        sanitizeTaskViewConfigForPersistence(createProjectTaskViewConfig(projectId, activeProjectView.viewConfig)),
        sanitizeTaskViewConfigForPersistence(currentDisplayViewConfig)
      )
    );
  }, [activeProjectView, currentDisplayViewConfig, projectId]);

  useEffect(() => {
    if (activeProjectView && activeTab !== 'tasks') {
      handleTabChange('tasks');
    }
  }, [activeProjectView, activeTab, handleTabChange]);

  useEffect(() => {
    setViewNameDraft(activeProjectView?.name ?? '');
    setIsEditingViewName(false);
  }, [activeProjectView?.id, activeProjectView?.name]);

  const handleSaveAsNew = () => {
    if (!currentSelectedTaskView) {
      setIsBookmarkDialogOpen(true);
    }
  };

  const handleOverride = async () => {
    if (!currentSelectedTaskView || !projectId) {
      return;
    }

    try {
      await updateTaskView(
        currentSelectedTaskView.id,
        currentSelectedTaskView.name,
        createProjectTaskViewConfig(projectId, currentDisplayViewConfig),
        projectId
      );
      setHasUnsavedChanges(false);
      toast.success('Project view updated successfully!');
    } catch {
      toast.error('Failed to update project view.');
    }
  };

  const handleRenameView = async () => {
    if (!activeProjectView || !projectId || !canRenameActiveView || isRenamingView) {
      return;
    }

    const trimmedName = viewNameDraft.trim();
    if (!trimmedName) {
      setViewNameDraft(activeProjectView.name);
      setIsEditingViewName(false);
      return;
    }

    if (trimmedName === activeProjectView.name) {
      setIsEditingViewName(false);
      return;
    }

    setIsRenamingView(true);
    try {
      const updatedView = await updateTaskView(
        activeProjectView.id,
        trimmedName,
        createProjectTaskViewConfig(projectId, currentDisplayViewConfig),
        projectId
      );
      navigate(`${PROJECTS_PATH}/${projectSlug}?view=${buildViewSlug(updatedView.name)}#tasks`, { replace: true });
      setIsEditingViewName(false);
      toast.success('Project view renamed successfully!');
    } catch {
      toast.error('Failed to rename project view.');
    } finally {
      setIsRenamingView(false);
    }
  };

  const handleNavigateToProjectHome = () => {
    if (!projectId || !projectSlug) {
      return;
    }

    navigate(`${PROJECTS_PATH}/${project.slug ?? projectSlug}`);
    setCurrentSelectedTaskView(null);
    setCurrentDisplayViewConfig(
      createProjectTaskViewConfig(projectId, {
        viewMode: currentDisplayViewConfig.viewMode,
      })
    );
  };

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
      <div className="flex items-center px-2 my-1">
        <div className="flex-1">
          {activeProjectView ? (
            <div className="px-1 flex items-center gap-1 min-w-0">
              <button
                type="button"
                className="max-w-[18rem] rounded-md px-2 py-1 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none"
                onClick={handleNavigateToProjectHome}
              >
                <span className="truncate block">{project.name}</span>
              </button>

              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />

              {isEditingViewName ? (
                <Input
                  value={viewNameDraft}
                  onChange={(event) => setViewNameDraft(event.target.value)}
                  onBlur={() => {
                    void handleRenameView();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                    if (event.key === 'Escape') {
                      setViewNameDraft(activeProjectView.name);
                      setIsEditingViewName(false);
                    }
                  }}
                  className="h-7 w-full max-w-[24rem] border-transparent px-2 py-1 text-sm font-medium leading-5 text-foreground shadow-none dark:text-slate-100"
                  autoFocus
                  disabled={isRenamingView}
                />
              ) : (
                <button
                  type="button"
                  className="max-w-[24rem] rounded-md px-2 py-1 text-left text-sm font-medium text-foreground dark:text-slate-100 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none"
                  onClick={() => {
                    if (canRenameActiveView) {
                      setViewNameDraft(activeProjectView.name);
                      setIsEditingViewName(true);
                    }
                  }}
                  disabled={!canRenameActiveView}
                >
                  <h1 className="text-sm font-medium leading-5 truncate text-foreground dark:text-slate-100">
                    {activeProjectView.name}
                  </h1>
                </button>
              )}
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={val => handleTabChange(val as typeof activeTab)}
            >
              <TabsList className="bg-white dark:bg-muted">
                <TabsTrigger value="overview" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
                  <List className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="tasks" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
                  <LayoutDashboard className="w-4 h-4" />
                  Tasks
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
          )}
        </div>

        {activeTab === 'tasks' && (
          <div className="flex items-center gap-1">
            <div className='flex items-center gap-2'>
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={currentSelectedTaskView ? 'Show saved views' : 'Add new project view'}
                        className="rounded-md p-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                        onClick={() => {
                          if (!currentSelectedTaskView) {
                            setIsBookmarkDialogOpen(true);
                          }
                        }}
                      >
                        {currentSelectedTaskView ? (
                          <SaveTaskViewPopover
                            onSaveNew={handleSaveAsNew}
                            onOverride={handleOverride}
                            onOpenDialog={() => setIsBookmarkDialogOpen(true)}
                            disabled={!hasUnsavedChanges || !isSavedView}
                          >
                            <Bookmark
                              className={
                                hasUnsavedChanges
                                  ? 'w-4 h-4 hover:scale-110 transition-transform duration-200 text-purple-500 stroke-2 fill-none'
                                  : isSavedView
                                    ? 'w-4 h-4 hover:scale-110 transition-transform duration-200 text-purple-500 fill-purple-500'
                                    : 'w-4 h-4 hover:scale-110 transition-transform duration-200 text-muted-foreground'
                              }
                              style={hasUnsavedChanges ? { stroke: '#a855f7' } : {}}
                            />
                          </SaveTaskViewPopover>
                        ) : (
                          <Bookmark className="w-4 h-4 hover:scale-110 transition-transform duration-200 text-muted-foreground" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center">
                      {hasUnsavedChanges
                        ? 'Click to save'
                        : isSavedView
                          ? 'Click to save as a new project view'
                          : 'Click to save as a project view'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {hasUnsavedChanges && <UnsavedChangesIndicator />}
              </div>

              <div className="mr-2">
                <TaskFilterMenu
                  showProjectSelect={false}
                  showDateRange={true}
                  showSearch={true}
                  tasks={tasks}
                  onFilter={setFilteredTasks}
                  selectedProject={projectId}
                  dateRange={dateRange}
                  searchTerm={searchTerm}
                  selectedLabelId={selectedLabelId}
                  selectedLabelSetId={selectedLabelSetId}
                  onDateRangeChange={(value) => {
                    setCurrentDisplayViewConfig({
                      ...currentDisplayViewConfig,
                      projectId,
                      dateRange: value,
                    });
                  }}
                  onSearchTermChange={(value) => {
                    setCurrentDisplayViewConfig({
                      ...currentDisplayViewConfig,
                      projectId,
                      searchTerm: value,
                    });
                  }}
                  onSelectedLabelChange={(value) => {
                    setCurrentDisplayViewConfig({
                      ...currentDisplayViewConfig,
                      projectId,
                      filterLabelId: value,
                    });
                  }}
                  onSelectedLabelSetChange={(value) => {
                    setCurrentDisplayViewConfig({
                      ...currentDisplayViewConfig,
                      projectId,
                      filterLabelSetId: value,
                    });
                  }}
                />
              </div>

              <Tabs
                value={currentDisplayViewConfig.viewMode}
                onValueChange={(value) => setCurrentDisplayViewConfigViewMode(value as TaskViewMode)}
              >
                <TabsList className="bg-white dark:bg-muted flex flex-row gap-0">
                  <TabsTrigger
                    value={TaskViewMode.BOARD}
                    className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger
                    value={TaskViewMode.LIST}
                    className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
                  >
                    <List className="w-4 h-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger
                    value={TaskViewMode.TABLE}
                    className="px-4 flex items-center gap-1.5 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
                  >
                    <Table2 className="w-4 h-4" />
                    Table
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="default"
                className="px-3 py-2 flex items-center gap-2 text-white bg-linear-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-transform duration-200 hover:scale-105"
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
            </div>
          </div>
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
          view={currentDisplayViewConfig.viewMode}
          onViewChange={setCurrentDisplayViewConfigViewMode}
          selectionScopeKey={projectId ?? projectSlug ?? null}
          scopeProjectId={projectId ?? null}
          onAddTask={() => {
            setEditingTask(null);
            setIsDialogOpen(true);
          }}
          onTaskClick={taskId => {
            const fullTask = tasks.find(t => t.id === taskId) || null;
            setEditingTask(fullTask);
            setIsDialogOpen(true);
          }}
          tasks={filteredTasks}
        />
      )}
      {activeTab === 'labels' && <ProjectLabelsTab />}
      {activeTab === 'team' && <ProjectTeamTab project={project} />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
    {isBookmarkDialogOpen && projectSlug && (
      <SaveTaskViewDialog
        open={isBookmarkDialogOpen}
        onOpenChange={setIsBookmarkDialogOpen}
        scopePath={`${PROJECTS_PATH}/${projectSlug}`}
        scopeProjectId={projectId}
      />
    )}
    </motion.div>
  );
}
