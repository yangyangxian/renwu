import { useState } from "react";
import { useTasks } from '@/hooks/useTasks';
import { useOutletContext } from "react-router-dom";
import { Card } from "@/components/ui-kit/Card";
import BoardView from "@/components/taskspage/BoardView";
import { TaskResDto, ProjectResDto } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Plus, Kanban, List } from "lucide-react";
import { TaskFilterMenu } from "@/components/taskspage/TaskFilterMenu";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";

export default function TasksPage() {
  const { projects } = useOutletContext<{ projects: ProjectResDto[] }>();

  const [view, setView] = useState("board");
  const {
    tasks,
    submitTask,
    deleteTask,
  } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>([]);

  return (
    <div className="w-full h-full flex flex-col pt-1 gap-2">
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
          />
          {/* View mode tabs and add task button */}
          <div className="flex items-center gap-2">
            <Tabs defaultValue={view} value={view} onValueChange={setView}>
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
               from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-200 duration-200 hover:scale-105"
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
            onSubmit={submitTask}
            title={editingTask ? "Edit Task" : "Add New Task"}
            projects={projects}
            initialValues={editingTask || {}}
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
            onTaskDelete={deleteTask}
            onTaskStatusChange={async (taskId, newStatus) => {
              const task = tasks.find(t => String(t.id) === String(taskId));
              if (!task) return;
              await submitTask({
                ...task,
                status: newStatus,
              });
            }}
          />
        </div>
      )}

      {view === 'list' && (
        filteredTasks.length === 0 ? (
          <div className="text-slate-500 dark:text-slate-400 my-8">No tasks found.</div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {filteredTasks.map((task, idx) => (
              <Card key={idx} className="bg-slate-50 dark:bg-slate-900 dark:border-slate-700 rounded-md px-4 py-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className="font-medium text-slate-800 dark:text-white text-sm">{task.title}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-300 mt-1 sm:mt-0">{task.description}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}

