import { useState, useEffect, useCallback } from "react";
import { motion } from 'framer-motion';
import { useTabHash } from "@/hooks/useTabHash";
import { useTaskStore } from '@/stores/useTaskStore';
import BoardView from "@/components/taskspage/BoardView";
import TaskListView from "@/components/taskspage/ListView";
import { TaskResDto, TaskViewMode } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-kit/Tooltip";
import { Plus, Kanban, List, Bookmark } from "lucide-react";
import { UnsavedChangesIndicator } from "@/components/common/UnsavedChangesIndicator";
import { TaskFilterMenu } from "@/components/taskspage/TaskFilterMenu";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";
import { SaveTaskViewDialog } from "@/components/taskspage/SaveTaskViewDialog";
import { SaveTaskViewPopover } from '@/components/taskspage/SaveTaskViewPopover';
import { toast } from 'sonner';
import logger from "@/utils/logger";
import { useTaskViewStore } from "@/stores/useTaskViewStore";
import isEqual from "lodash/isEqual";

export default function MyTasksPage() {
  const { tasks, fetchMyTasks } = useTaskStore();
  const {
    currentSelectedTaskView,
    currentDisplayViewConfig,
    setCurrentDisplayViewConfigViewMode,
    updateTaskView,
  } = useTaskViewStore();

  logger.debug("currentSelectedTaskView:" + currentSelectedTaskView?.viewConfig.viewMode);
  const tabOptions = [TaskViewMode.BOARD, TaskViewMode.LIST];

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const [view, setView] = useTabHash(tabOptions, currentDisplayViewConfig.viewMode,
    currentDisplayViewConfig.viewMode, setCurrentDisplayViewConfigViewMode
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const isSavedView = !!currentSelectedTaskView;

  // Unsaved changes detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    logger.debug(currentSelectedTaskView?.viewConfig.projectId + " " + currentDisplayViewConfig.projectId);
    if (currentSelectedTaskView && currentDisplayViewConfig) {
      setHasUnsavedChanges(!isEqual(currentSelectedTaskView.viewConfig, currentDisplayViewConfig));
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
      await updateTaskView(currentSelectedTaskView.id, currentSelectedTaskView.name, currentDisplayViewConfig);
      setHasUnsavedChanges(false);
      toast.success('Task view updated successfully!');
    } catch {
      toast.error('Failed to update task view.');
    }
  }, [currentSelectedTaskView, currentDisplayViewConfig, updateTaskView]);

  return (
    <motion.div
      className="w-full h-full flex flex-col pt-1 gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Responsive menu bar: all controls in one row on all devices */}
      <div id="menuBar" className="w-full px-2">
        <div className="flex flex-row w-full gap-2 items-start sm:items-center flex-wrap">
          {/* TaskFilterMenu now owns filter state and logic */}
          <div className="flex items-center">
            <TaskFilterMenu
              showDateRange={true}
              showProjectSelect={true}
              showSearch={true}
              tasks={tasks}
              onFilter={setFilteredTasks}
              onProjectSelect={setSelectedProjectId}
            />
          </div>
            {/* Bookmark icon next to search input */}
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {currentSelectedTaskView ? (
                    <SaveTaskViewPopover
                      onSaveNew={handleSaveAsNew}
                      onOverride={handleOverride}
                      onOpenDialog={() => setIsBookmarkDialogOpen(true)}
                      disabled={!hasUnsavedChanges || !isSavedView}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Show saved views"
                        className="rounded-md p-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                      >
                        <Bookmark className={
                          `w-4 h-4 hover:scale-115 transition-transform duration-200 ${isSavedView ? 'text-purple-500 fill-purple-500' : 'text-muted-foreground'}`
                        } />
                      </span>
                    </SaveTaskViewPopover>
                  ) : (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Add new task view"
                      className="rounded-md p-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                      onClick={() => setIsBookmarkDialogOpen(true)}
                    >
                      <Bookmark className="w-4 h-4 hover:scale-115 transition-transform duration-200 text-muted-foreground" />
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  {hasUnsavedChanges ? 'You have unsaved changes to this view' : 'Save as a task view'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {hasUnsavedChanges && <UnsavedChangesIndicator />}
          </div>

          {/* View mode tabs and add task button */}
            <div className="flex items-center gap-2 ml-auto">
              <Tabs defaultValue={view} value={view} onValueChange={v => setView(v as typeof tabOptions[number])}>
                <TabsList className="bg-white dark:bg-muted flex flex-row gap-0">
                  <TabsTrigger value="board" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black">
                    <Kanban className="w-4 h-4" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black">
                    <List className="w-4 h-4" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="default"
                className="px-3 py-2 flex items-center gap-2 text-white bg-gradient-to-r
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
            initialValues={editingTask || (selectedProjectId ? { projectId: selectedProjectId } : {})}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 rounded-xl">
        {currentDisplayViewConfig.viewMode === TaskViewMode.BOARD && (       
          <BoardView
            tasks={filteredTasks}
            onTaskClick={taskId => {
              const fullTask = tasks.find(t => t.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
          />
        )}

        {currentDisplayViewConfig.viewMode === TaskViewMode.LIST && (
          <TaskListView 
            tasks={filteredTasks} 
          />
        )}
      </div>
    {isBookmarkDialogOpen && <SaveTaskViewDialog
      open={isBookmarkDialogOpen}
      onOpenChange={setIsBookmarkDialogOpen}
    />
    }
    </motion.div>
  );
}
