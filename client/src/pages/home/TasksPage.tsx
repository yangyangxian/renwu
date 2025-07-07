import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui-kit/Card";
import BoardView from "@/components/taskspage/BoardView";
import { apiClient } from '@/utils/APIClient';
import { TaskResDto, ProjectResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Plus } from "lucide-react";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";

export default function TasksPage() {
  const { projects } = useOutletContext<{ projects: ProjectResDto[] }>();

  const [view, setView] = useState("board");
  const [selectedProject, setSelectedProject] = useState("all");
  const [tasks, setTasks] = useState<TaskResDto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  // Date range filter: '1m' = last 1 month, '3m' = last 3 months, '1y' = last 1 year, 'all' = no filter
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '1y' | 'all'>('1m');

  const fetchTasks = async () => {
    try {
      const data = await apiClient.get<TaskResDto[]>(`/api/tasks/me`);
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks.');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    // Calculate threshold date based on dateRange
    let threshold: Date | null = null;
    if (dateRange !== 'all') {
      threshold = new Date();
      if (dateRange === '1m') threshold.setMonth(threshold.getMonth() - 1);
      if (dateRange === '3m') threshold.setMonth(threshold.getMonth() - 3);
      if (dateRange === '1y') threshold.setFullYear(threshold.getFullYear() - 1);
      threshold.setHours(0, 0, 0, 0);
    }
    return tasks.filter(t => {
      const updatedAt = t.updatedAt ? new Date(t.updatedAt) : null;
      const dateOk = !threshold || (updatedAt && updatedAt >= threshold);
      // If projectId is null/undefined, treat as 'personal'.
      const isPersonal = t.projectId === null || t.projectId === undefined || t.projectId === '';
      if (selectedProject === 'all') return dateOk;
      if (selectedProject === 'personal') return dateOk && isPersonal;
      // Compare projectId loosely (number or string, allow for type coercion)
      return dateOk && t.projectId == selectedProject;
    });
  }, [tasks, dateRange, selectedProject]);

  const allProjectMembers = useMemo(() => {
    const allMembers = projects.flatMap((p: ProjectResDto) =>
      Array.isArray(p.members)
        ? p.members.map((m: any) => ({ ...m, projectId: p.id }))
        : []
    );
    const seen = new Set<string>();
    return allMembers
      .filter((m: any) => typeof m.id === 'string' && m.id && !seen.has(m.id) && !!seen.add(m.id))
      .map((m: any) => ({ id: m.id as string, name: m.name, projectId: m.projectId }));
  }, [projects]);

  const handleTaskSubmit = async (task: any) => {
    if (task.id) {
      const updatePayload: TaskUpdateReqDto = {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        assignedTo: task.assignedTo,
        projectId: task.projectId,
      };
      try {
        await apiClient.put<TaskUpdateReqDto, TaskResDto>(`/api/tasks/${task.id}`, updatePayload);
        await fetchTasks();
        toast.success('Task updated!');
      } catch (e) {
        toast.error('Failed to update task.');
      }
    } else {
      const createPayload: TaskCreateReqDto = {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        assignedTo: task.assignedTo,
        projectId: task.projectId,
        createdBy: task.createdBy
      };
      try {
        await apiClient.post<TaskCreateReqDto, TaskResDto>(`/api/tasks`, createPayload);
        await fetchTasks();
        toast.success('Task added!');
      } catch (e) {
        // error handled by toast
        toast.error('Failed to create task.');
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await apiClient.delete(`/api/tasks/${taskId}`);
      await fetchTasks();
      toast.success('Task deleted!');
    } catch (e) {
      toast.error('Failed to delete task.');
    }
  };
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div id="menuBar" className="flex gap-3 items-center">
        <Select value={selectedProject} onValueChange={setSelectedProject} defaultValue="all">
          <SelectTrigger
            className="min-w-[9rem] px-3 bg-white dark:text-slate-200"
            id="project-select"
          >
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="personal">Personal Tasks</SelectItem>
            {/* Divider */}
            {projects.length > 0 && <div className="h-px bg-gray-200 my-1 mx-2" role="separator" />}
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range dropdown */}
        <div className="flex items-center">
          <Select value={dateRange} onValueChange={v => setDateRange(v as any)}>
            <SelectTrigger className="min-w-[8rem] px-3 bg-white dark:text-slate-200" id="date-range-select">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last 1 month</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="1y">Last 1 year</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for Board/List/Calendar views */}
        <Tabs defaultValue={view} value={view} onValueChange={setView}>
          <TabsList className="bg-white dark:bg-muted">
            <TabsTrigger value="board" className="px-4 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="px-4 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <Button
            variant="default"
            className="px-3 py-2 flex items-center gap-2 text-white bg-gradient-to-r
             from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-200 duration-200 hover:scale-105"
            onClick={() => {
              // If a project is selected (not 'all' or 'personal'), prefill projectId
              if (selectedProject !== 'all' && selectedProject !== 'personal') {
                setEditingTask({ projectId: selectedProject } as any);
              } else {
                setEditingTask(null);
              }
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Task</span>
          </Button>
          {isDialogOpen && (
            <TaskDialog
              open={isDialogOpen}
              onOpenChange={open => {
                setIsDialogOpen(open);
                if (!open) setEditingTask(null);
              }}
              onSubmit={handleTaskSubmit}
              title={editingTask ? "Edit Task" : "Add New Task"}
              projects={projects}
              projectMembers={allProjectMembers}
              initialValues={editingTask || {}}
            />
          )}
        </div>
      </div>

      {view === 'board' && (
        <div className="flex-1 overflow-auto pb-1">
          <BoardView
            tasks={filteredTasks}
            onTaskClick={taskId => {
              const fullTask = tasks.find(t => t.id === taskId) || null;
              setEditingTask(fullTask);
              setIsDialogOpen(true);
            }}
            onTaskDelete={handleDelete}
            onTaskStatusChange={async (taskId, newStatus) => {
              const task = tasks.find(t => String(t.id) === String(taskId));
              if (!task) return;
              try {
                await apiClient.put(`/api/tasks/${taskId}`,
                  {
                    title: task.title,
                    description: task.description,
                    dueDate: task.dueDate,
                    status: newStatus,
                    assignedTo: task.assignedTo,
                    projectId: task.projectId,
                  }
                );
                await fetchTasks();
                toast.success('Task status updated!');
              } catch (e) {
                toast.error('Failed to update task status.');
              }
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

