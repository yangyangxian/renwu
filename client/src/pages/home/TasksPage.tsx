import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  const [view, setView] = useState("board");
  const [selectedProject, setSelectedProject] = useState("all");

  const tasks = [
    {
      title: "Design landing page",
      subtitle: "UI/UX • In Progress",
      description: "Create a modern, clean landing page with sidebar and dark mode support."
    },
    {
      title: "Implement authentication",
      subtitle: "Backend • Todo",
      description: "Add user sign up, sign in, and JWT-based session management."
    },
    {
      title: "Set up database",
      subtitle: "Database • Todo",
      description: "Configure and connect to a scalable database for tasks and users."
    }
  ];

  // Filter tasks by selected project (simple mock logic)
  const filteredTasks = selectedProject === "all"
    ? tasks
    : selectedProject === "personal"
      ? tasks.filter(t => t.subtitle.toLowerCase().includes("personal"))
      : tasks.filter(t => t.subtitle.toLowerCase().includes(selectedProject));

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Select defaultValue={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger
            className="min-w-[10rem] h-9 px-3 rounded-md bg-white text-slate-900 dark:text-slate-200"
            id="project-select"
          >
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent>
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
      {view === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full">
          {filteredTasks.map((task, idx) => (
            <Card key={idx} className="text-left">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white text-base">{task.title}</CardTitle>
                <div className="text-xs text-slate-500 dark:text-slate-200">{task.subtitle}</div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs text-slate-400 dark:text-slate-300 mt-1">
                  {task.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {view === 'list' && (
        <div className="flex flex-col gap-2 w-full">
          {filteredTasks.map((task, idx) => (
            <Card key={idx} className="bg-slate-50 dark:bg-slate-900 dark:border-slate-700 rounded-md px-4 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-white text-sm">{task.title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-200">{task.subtitle}</span>
                <span className="text-xs text-slate-400 dark:text-slate-300 mt-1 sm:mt-0">{task.description}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {view === 'calendar' && (
        <Card className="w-full text-center py-12">
          <span className="text-slate-500 dark:text-slate-400">📅 Calendar view coming soon...</span>
        </Card>
      )}
    </>
  );
}
