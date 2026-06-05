import { useState, useEffect, useCallback } from "react";
import { motion } from 'framer-motion';
import { useTabHash } from "@/hooks/useTabHash";
import { useTaskStore } from '@/stores/useTaskStore';
import BoardView from "@/components/taskspage/BoardView";
import TaskListView from "@/components/taskspage/ListView";
import TableView from "@/components/taskspage/TableView";
import TimelineView from "@/components/taskspage/TimelineView";
import { TaskResDto, TaskViewMode, TaskDateRange } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-kit/Tooltip";
import { Plus } from "lucide-react";
import { UnsavedChangesIndicator } from "@/components/common/UnsavedChangesIndicator";
import { TaskFilterMenu } from "@/components/taskspage/TaskFilterMenu";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";
import { SaveTaskViewDialog } from "@/components/taskspage/SaveTaskViewDialog";
import { SaveTaskViewPopover } from '@/components/taskspage/SaveTaskViewPopover';
import { getTaskViewToolbarActionIcon } from '@/components/taskspage/taskViewToolbarActionIcon';
import { toast } from 'sonner';
import logger from "@/utils/logger";
import { sanitizeTaskViewConfigForPersistence, useTaskViewStore } from "@/stores/useTaskViewStore";
import isEqual from "lodash/isEqual";
import { HomePageSkeleton } from "@/components/homepage/HomePageSkeleton";
import { MYTASKS_PATH } from "@/routes/routeConfig";
import { TASK_VIEW_MODE_ORDER, getTaskViewModeMeta } from "@/lib/taskViewModeMeta";
import { useAuth } from "@/providers/AuthProvider";

export default function PersonalTasksPage() {
  const { user } = useAuth();
  const { tasks, loading, fetchPersonalTasks } = useTaskStore();
  const {
    currentSelectedTaskView,
    currentDisplayViewConfig,
    setCurrentDisplayViewConfigViewMode,
    updateTaskView,
    setCurrentDisplayViewConfig,
    personalDisplayViewConfig,
  } = useTaskViewStore();

  const tabOptions = TASK_VIEW_MODE_ORDER;
  const [view, setView] = useTabHash(tabOptions, currentDisplayViewConfig.viewMode,
    currentDisplayViewConfig.viewMode, setCurrentDisplayViewConfigViewMode
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>([]);
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const isSavedView = !!currentSelectedTaskView && !currentSelectedTaskView.projectId;

  // Controlled filter values (lifted from TaskFilterMenu)
  logger.debug("Current display view config:", currentDisplayViewConfig);
  const selectedProject = 'personal';
  const dateRange: TaskDateRange = currentDisplayViewConfig.dateRange ?? TaskDateRange.ALL_TIME;
  const searchTerm = currentDisplayViewConfig.searchTerm ?? '';
  const selectedLabelId = currentDisplayViewConfig.filterLabelId ?? null;
  const selectedLabelIds = currentDisplayViewConfig.filterLabelIds ?? null;
  const selectedLabelSetId = currentDisplayViewConfig.filterLabelSetId ?? null;
  const selectedLabelSetLabelIds = currentDisplayViewConfig.filterLabelSetLabelIds ?? null;
  const selectedLabelSetLabelIdsBySet = currentDisplayViewConfig.filterLabelSetLabelIdsBySet ?? null;

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void fetchPersonalTasks(user.id);
  }, [fetchPersonalTasks, user?.id]);

  useEffect(() => {
    if (currentSelectedTaskView) {
      if (currentDisplayViewConfig.projectId !== 'personal') {
        setCurrentDisplayViewConfig({
          ...currentDisplayViewConfig,
          projectId: 'personal',
        });
      }
      return;
    }

    if (currentDisplayViewConfig.projectId !== 'personal') {
      setCurrentDisplayViewConfig(personalDisplayViewConfig);
    }
  }, [
    currentDisplayViewConfig,
    currentSelectedTaskView,
    personalDisplayViewConfig,
    setCurrentDisplayViewConfig,
  ]);

  // Unsaved changes detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const TaskViewToolbarActionIcon = getTaskViewToolbarActionIcon(Boolean(currentSelectedTaskView));
  useEffect(() => {
    if (currentSelectedTaskView && !currentSelectedTaskView.projectId && currentDisplayViewConfig) {
      setHasUnsavedChanges(
        !isEqual(
          sanitizeTaskViewConfigForPersistence(currentSelectedTaskView.viewConfig),
          sanitizeTaskViewConfigForPersistence(currentDisplayViewConfig)
        )
      );
    } else {
      setHasUnsavedChanges(false);
    }
  }, [currentSelectedTaskView, currentDisplayViewConfig]);

  const handleSaveAsNew = useCallback(() => {
    if (!currentSelectedTaskView) {
      // No view selected, show dialog directly
      setIsBookmarkDialogOpen(true);
    }
    // Otherwise, let the popover handle it (popover will be disabled in this case)
  }, [currentSelectedTaskView]);

  const handleOverride = useCallback(async () => {
    if (!currentSelectedTaskView) return;
    try {
      await updateTaskView(currentSelectedTaskView.id, currentSelectedTaskView.name, currentDisplayViewConfig, null);
      setHasUnsavedChanges(false);
      toast.success('Task view updated successfully!');
    } catch {
      toast.error('Failed to update task view.');
    }
  }, [currentSelectedTaskView, currentDisplayViewConfig, updateTaskView]);

  return (
    <>
    { loading && tasks.length === 0 &&
      <HomePageSkeleton />
    }

    { (!loading || tasks.length > 0) && 
    <motion.div
      className="w-full h-full flex flex-col pt-1 gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div id="menuBar" className="w-full px-2">
        <div className="flex flex-row w-full gap-2 items-start sm:items-center flex-wrap">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={currentSelectedTaskView ? "Show saved views" : "Add new task view"}
                    className="rounded-md p-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                    onClick={() => {
                      if (!currentSelectedTaskView) setIsBookmarkDialogOpen(true);
                    }}
                  >
                    {currentSelectedTaskView ? (
                      <SaveTaskViewPopover
                        onSaveNew={handleSaveAsNew}
                        onOverride={handleOverride}
                        onOpenDialog={() => setIsBookmarkDialogOpen(true)}
                        disabled={!hasUnsavedChanges || !isSavedView}
                      >
                        <TaskViewToolbarActionIcon className={
                          hasUnsavedChanges
                            ? "w-4 h-4 hover:scale-110 transition-transform duration-200 text-purple-500 stroke-2 fill-none"
                            : isSavedView
                              ? "w-4 h-4 hover:scale-110 transition-transform duration-200 text-purple-500 fill-purple-500"
                              : "w-4 h-4 hover:scale-110 transition-transform duration-200 text-muted-foreground"
                        } style={hasUnsavedChanges ? { stroke: '#a855f7' } : {}} />
                      </SaveTaskViewPopover>
                    ) : (
                      <TaskViewToolbarActionIcon className="w-4 h-4 hover:scale-110 transition-transform duration-200 text-muted-foreground" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  {hasUnsavedChanges
                    ? 'Click to save'
                    : (isSavedView
                        ? 'Click to save as a new task view'
                        : 'Click to save as a task view')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {hasUnsavedChanges && <UnsavedChangesIndicator />}
          </div>

          <div className="flex items-center">
            <TaskFilterMenu
              showDateRange={true}
              showProjectSelect={false}
              showSearch={true}
              tasks={tasks}
              onFilter={setFilteredTasks}
              selectedProject={selectedProject}
              dateRange={dateRange}
              searchTerm={searchTerm}
              selectedLabelId={selectedLabelId}
              selectedLabelIds={selectedLabelIds}
              selectedLabelSetId={selectedLabelSetId}
              selectedLabelSetLabelIds={selectedLabelSetLabelIds}
              selectedLabelSetLabelIdsBySet={selectedLabelSetLabelIdsBySet}
              onSelectedProjectChange={(v) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  projectId: v,
                });
              }}
              onDateRangeChange={(v) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  dateRange: v,
                });
              }}
              onSearchTermChange={(v) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  searchTerm: v,
                });
              }}
              onSelectedLabelChange={(value) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  filterLabelId: value,
                });
              }}
              onSelectedLabelIdsChange={(value) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  filterLabelId: null,
                  filterLabelIds: value,
                });
              }}
              onSelectedLabelSetChange={(value, labelIds) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  filterLabelSetId: value,
                  filterLabelSetLabelIds: labelIds ?? null,
                });
              }}
              onSelectedLabelSetLabelIdsChange={(value) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  filterLabelSetLabelIds: value,
                });
              }}
              onSelectedLabelSetLabelIdsBySetChange={(value) => {
                setCurrentDisplayViewConfig({
                  ...currentDisplayViewConfig,
                  filterLabelSetId: null,
                  filterLabelSetLabelIds: null,
                  filterLabelSetLabelIdsBySet: value,
                });
              }}
            />
          </div>

          {/* View mode tabs and add task button */}
            <div className="flex items-center gap-2 ml-auto">
              <Tabs defaultValue={view} value={view} onValueChange={v => setView(v as typeof tabOptions[number])}>
                <TabsList className="bg-white dark:bg-muted flex flex-row gap-0">
                  {tabOptions.map((mode) => {
                    const { icon: ViewModeIcon, label } = getTaskViewModeMeta(mode);

                    return (
                      <TabsTrigger
                        key={mode}
                        value={mode}
                        className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
                      >
                        <ViewModeIcon className="w-4 h-4" />
                        {label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
              <Button
                variant="default"
                className="px-3 py-2 flex items-center gap-2 text-white bg-linear-to-r
                from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-transform duration-200 hover:scale-105"
                onClick={() => {
                  setEditingTask(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-5 h-5" />
                <span className="">Add Task</span>
              </Button>
            </div>
            

        </div>
        {isDialogOpen && (
          <TaskDialog
            open={isDialogOpen}
            onOpenChange={open => {
              setIsDialogOpen(open);
              if (!open) setEditingTask(null);
            }}
            title={editingTask ? "Edit Task" : "Add New Task"}
            personalTaskMode={true}
            labelFilter={editingTask ? undefined : {
              selectedLabelId,
              selectedLabelIds,
              selectedLabelSetId,
              selectedLabelSetLabelIds,
              selectedLabelSetLabelIdsBySet,
            }}
            initialValues={editingTask ? {
              ...editingTask,
              labels: editingTask.labels || [],
            } : {}}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl p-2 pl-3">
        {currentDisplayViewConfig.viewMode === TaskViewMode.BOARD && (       
          <BoardView
            tasks={filteredTasks}
            onTaskClick={taskId => {
              const fullTask = tasks.find(t => t.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
            refreshTasks={() => fetchPersonalTasks(user?.id)}
            showProjectName={false}
          />
        )}

        {currentDisplayViewConfig.viewMode === TaskViewMode.LIST && (
          <TaskListView 
            tasks={filteredTasks} 
          />
        )}

        {currentDisplayViewConfig.viewMode === TaskViewMode.TABLE && (
          <TableView
            tasks={filteredTasks}
            scopeProjectId={selectedProject as string | 'all' | null}
            storageScopeKey="personal-tasks"
            onOpenTask={(taskId) => {
              const fullTask = tasks.find((task) => task.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
          />
        )}

        {currentDisplayViewConfig.viewMode === TaskViewMode.TIMELINE && (
          <TimelineView
            tasks={filteredTasks}
            refreshTasks={() => fetchPersonalTasks(user?.id)}
            onTaskClick={(taskId) => {
              const fullTask = tasks.find((task) => task.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
            showAssignedTo={true}
            showProjectName={false}
          />
        )}
      </div>
    {isBookmarkDialogOpen && <SaveTaskViewDialog
      open={isBookmarkDialogOpen}
      onOpenChange={setIsBookmarkDialogOpen}
      scopePath={MYTASKS_PATH}
      scopeProjectId={null}
    />
    }
    </motion.div>
    }
    </>
  );
}
