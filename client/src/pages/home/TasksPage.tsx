import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui-kit/Card";
import { Outlet } from "react-router-dom";
import BoardView from "@/components/taskspage/BoardView";
import { apiClient } from '@/utils/APIClient';
import { TaskResDto, ProjectResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { Plus } from "lucide-react";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui-kit/Tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui-kit/Popover";
import { Calendar } from "@/components/ui-kit/Calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

export default function TasksPage() {
  const [view, setView] = useState("board");
  const [selectedProject, setSelectedProject] = useState("all");
  const [tasks, setTasks] = useState<TaskResDto[]>([]);
  const [projects, setProjects] = useState<ProjectResDto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResDto | null>(null);
  const [dateThreshold, setDateThreshold] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    apiClient.get<ProjectResDto[]>(`/api/projects/me`)
      .then(setProjects)
      .catch(() => {});
  }, []);

  // Filter by project and date (memoized)
  const filteredTasks = useMemo(() =>
    tasks.filter(t => {
      const dateOk = t.updatedAt && new Date(t.updatedAt) >= dateThreshold;
      // If projectId is null/undefined, treat as 'personal'.
      const isPersonal = t.projectId === null || t.projectId === undefined || t.projectId === '';
      if (selectedProject === 'all') return dateOk;
      if (selectedProject === 'personal') return dateOk && isPersonal;
      // Compare projectId loosely (number or string, allow for type coercion)
      return dateOk && t.projectId == selectedProject;
    })
  , [tasks, dateThreshold, selectedProject]);

  const allProjectMembers = useMemo(() => {
    const allMembers = projects.flatMap(p =>
      Array.isArray(p.members)
        ? p.members.map(m => ({ ...m, projectId: p.id }))
        : []
    );
    const seen = new Set<string>();
    return allMembers
      .filter(m => typeof m.id === 'string' && m.id && !seen.has(m.id) && !!seen.add(m.id))
      .map(m => ({ id: m.id as string, name: m.name, projectId: m.projectId }));
  }, [projects]);

  // Handler for add/edit task dialog submit
  const handleTaskSubmit = async (task: any) => {
    if (task.id) {
      // Edit mode: update task via API
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
        // error handled by toast
        toast.error('Failed to update task.');
      }
    } else {
      // Add mode: create new task via API
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

  return (
    <div className="w-full">
      <div id="menuBar" className="flex my-3 gap-3 items-center">
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
            <div className="h-px bg-gray-200 my-1 mx-2" role="separator" />
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date picker using Shadcn UI Popover + Calendar */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    className="w-full min-w-[9rem] justify-between text-secondary-foreground"
                    variant="outline"
                    aria-label="Show tasks updated since"
                  >
                    {formatDate(dateThreshold)}
                    <CalendarIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  From updated date
                </TooltipContent>
              </Tooltip>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateThreshold}
              onSelect={d => { if (d) setDateThreshold(d); }}
            />
          </PopoverContent>
        </Popover>

        {/* Tabs for Board/List/Calendar views */}
        <Tabs defaultValue={view} value={view} onValueChange={setView}>
          <TabsList className="bg-white dark:bg-muted">
            <TabsTrigger value="board" className="px-4 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="px-4 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-4 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <Button variant="outline" onClick={() => { setEditingTask(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Task
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
        <BoardView
          tasks={filteredTasks}
          onTaskClick={taskId => {
            const fullTask = tasks.find(t => t.id === taskId) || null;
            setEditingTask(fullTask);
            setIsDialogOpen(true);
          }}
        />
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
      {view === 'calendar' && (
        <Card className="w-full text-center py-12">
          <span className="text-slate-500 dark:text-slate-400">📅 Calendar view coming soon...</span>
        </Card>
      )}
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
