import { useState, useEffect } from "react";
import { useTabHash } from "@/hooks/useTabHash";
import { useTaskStore } from '@/stores/useTaskStore';
import { useProjectStore } from '@/stores/useProjectStore';
import BoardView from "@/components/taskspage/BoardView";
import TaskListView from "@/components/taskspage/TaskListView";
import { TaskResDto } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Plus, Kanban, List } from "lucide-react";
import { TaskFilterMenu } from "@/components/taskspage/TaskFilterMenu";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";
import { motion } from "framer-motion";

export default function TasksPage() {
  const tabOptions = ["board", "list"];
  const [view, setView] = useTabHash(tabOptions, "board");
  const {
    tasks,
    loading,
    error,
    fetchMyTasks,
    updateTaskById,
  } = useTaskStore();

  // Use project store instead of outlet context
  const { projects } = useProjectStore();

  // Fetch tasks when component mounts (route-specific data)
  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <motion.div
      className="w-full h-full flex flex-col pt-1 gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Responsive menu bar: all controls in one row on all devices */}
      <div id="menuBar" className="w-full px-2">
        <div className="flex flex-row w-full gap-3 items-start sm:items-center flex-wrap">
          {/* TaskFilterMenu now owns filter state and logic */}
          <TaskFilterMenu
            showDateRange={true}
            showProjectSelect={true}
            showSearch={true}
            projects={projects}
            tasks={tasks}
            onFilter={setFilteredTasks}
            onProjectSelect={setSelectedProjectId}
          />
          {/* View mode tabs and add task button */}
          <div className="flex items-center gap-2">
            <Tabs defaultValue={view} value={view} onValueChange={v => setView(v as typeof tabOptions[number])}>
              <TabsList className="bg-white dark:bg-muted flex flex-row gap-0">
                <TabsTrigger value="board" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black">
                  <Kanban className="w-4 h-4" />
                  <span>Board</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black">
                  <List className="w-4 h-4" />
                  <span>List</span>
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

      {view === 'board' && (
        <div className="flex-1 overflow-y-auto p-2 rounded-xl">
          <BoardView
            tasks={filteredTasks}
            onTaskClick={taskId => {
              const fullTask = tasks.find(t => t.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
          />
        </div>
      )}

      {view === 'list' && (
        <TaskListView 
          tasks={filteredTasks} 
          onUpdateTask={updateTaskById}
        />
      )}
    </motion.div>
  );
}

