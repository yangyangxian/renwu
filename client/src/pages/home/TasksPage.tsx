import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui-kit/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui-kit/Tabs";
import { Card } from "@/components/ui-kit/Card";
import { Outlet } from "react-router-dom";
import BoardView from "@/components/taskspage/BoardView";
import { apiClient } from '@/utils/APIClient';
import { ApiErrorResponse, ErrorCodes, TaskResDto } from '@fullstack/common';
import { getErrorMessage } from '@/resources/errorMessages';

export default function TasksPage() {
  const [view, setView] = useState("board");
  const [selectedProject, setSelectedProject] = useState("all");
  const [tasks, setTasks] = useState<TaskResDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<TaskResDto[]>(`/api/tasks/me`)
      .then((data) => {
        setTasks(data);
        setError(null);
      })
      .catch((apiError: ApiErrorResponse) => {
        setError(apiError?.message || 'An unknown error occurred.');
      });
  }, []);

  // Filter tasks by selected project (simple mock logic)
  const filteredTasks = selectedProject === "all"
    ? tasks
    : tasks; // No subtitle, so no further filtering

  // Debug log
  console.log('Tasks from API:', tasks);
  console.log('Filtered tasks:', filteredTasks);

  return (
    <>
      <div className="flex items-center gap-4 my-3">
        <Select defaultValue={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger
            className="min-w-[10rem] h-9 px-3 rounded-md bg-white dark:text-slate-200"
            id="project-select"
          >
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent className="border-none">
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="personal">Personal Tasks</SelectItem>
            <SelectItem value="demo">Demo Project</SelectItem>
            <SelectItem value="work">Work Project</SelectItem>
            <SelectItem value="create">+ Create New Project</SelectItem>
          </SelectContent>
        </Select>
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
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {view === 'board' && (
        filteredTasks.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 my-8">No tasks found.</div>
        ) : (
          <BoardView tasks={filteredTasks} />
        )
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
      {/* Subpage content will be embedded here when on a subroute like /tasks/subtask */}
      <div className="mt-8">
        <Outlet />
      </div>
    </>
  );
}
