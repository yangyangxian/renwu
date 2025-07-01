import { useState, useEffect } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Outlet } from "react-router-dom";
import BoardView from "@/components/taskspage/BoardView";
import { apiClient } from '@/utils/APIClient';
import { TaskResDto, ProjectResDto } from '@fullstack/common';
import { Button } from "@/components/ui-kit/Button";
import { TaskDialog } from "@/components/taskspage/TaskDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Calendar as CalendarIcon } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dateThreshold, setDateThreshold] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    apiClient.get<TaskResDto[]>(`/api/tasks/me`)
      .then(setTasks)
      .catch(() => setError('Failed to load tasks.'));
    apiClient.get<ProjectResDto[]>(`/api/projects/me`)
      .then(setProjects)
      .catch(() => {});
  }, []);

  // Filter by project and date
  const filteredTasks = tasks.filter(t => {
    const dateOk = t.updatedAt && new Date(t.updatedAt) >= dateThreshold;
    // If projectId is null/undefined, treat as 'personal'.
    const isPersonal = t.projectId === null || t.projectId === undefined || t.projectId === '';
    if (selectedProject === 'all') return dateOk;
    if (selectedProject === 'personal') return dateOk && isPersonal;
    // Compare projectId loosely (number or string, allow for type coercion)
    return dateOk && t.projectId == selectedProject;
  });

  return (
    <div className="w-full">
      <div id="menuBar" className="flex my-3 gap-3 items-center">
        <Select value={selectedProject} onValueChange={setSelectedProject} defaultValue="all">
          <SelectTrigger
            className="min-w-[10rem] h-9 px-3 rounded-md bg-white dark:text-slate-200"
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
            <div className="relative group w-[10rem]">
              <Button
                type="button"
                className="w-full h-9 min-w-[10rem] px-3 text-left justify-between"
                variant="outline"
                aria-label="Show tasks updated since"
              >
                <span>{formatDate(dateThreshold)}</span>
                <CalendarIcon className="size-3.5" />
              </Button>
              {/* Tooltip for date picker (now appears below the button, centered) */}
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 z-10 whitespace-nowrap">
                Filter by updated date
              </span>
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
            <TabsTrigger value="board" className="px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="px-4 py-2 text-sm font-medium focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto">
          <Button variant="default" onClick={() => setIsDialogOpen(true)}>
            + Add Task
          </Button>
          <TaskDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={task => {
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 1500);
              setTasks(prev => [
                { id: Math.random().toString(), title: task.description.slice(0, 24) || 'Untitled', ...task },
                ...prev
              ]);
            }}
            title="Add New Task"
          />
          {showSuccess && (
            <div className="text-green-600 text-sm mt-2">Task added (demo only)</div>
          )}
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {/* Always show BoardView for minimal UI, even if no tasks */}
      {view === 'board' && (
        <BoardView tasks={filteredTasks} />
      )}
      {view === 'list' && (
        filteredTasks.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 my-8">No tasks found.</div>
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
