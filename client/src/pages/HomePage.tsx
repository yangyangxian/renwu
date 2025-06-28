import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, Folder, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  const location = useLocation();
  const { isDark, toggleDark } = useDarkMode();
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
    },
    {
      title: "Invite team members",
      subtitle: "Team • Todo",
      description: "Send invitations and manage team collaboration features."
    }
  ];

  // Filter tasks by selected project (simple mock logic)
  const filteredTasks = selectedProject === "all"
    ? tasks
    : selectedProject === "personal"
      ? tasks.filter(t => t.subtitle.toLowerCase().includes("personal"))
      : tasks.filter(t => t.subtitle.toLowerCase().includes(selectedProject));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col pt-16">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-black dark:border-2 shadow-md z-50 flex justify-between items-center h-16 px-5">
        <div className="flex items-center gap-6">
          <span className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Task manager
          </span>
          {/* Project selector removed from navbar */}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="default" size="sm">Sign In</Button>
          <Button variant="secondary" size="sm">Sign Up</Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">
            <svg className="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="5"/></svg>
            <svg className="w-5 h-5 hidden dark:inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1">
        {/* Sidebar with icon and text */}
        <aside>
          <Card className="w-48 h-[calc(100vh-6rem)] px-3 py-3 flex flex-col items-center gap-2 overflow-y-auto m-3">
            <CardContent className="flex flex-col gap-1 w-full p-0">
              <Button
                variant={['board', 'list', 'calendar'].includes(view) ? 'secondary' : 'ghost'}
                className={`w-full flex items-center gap-3 px-4 justify-start text-base font-medium
                  ${['board', 'list', 'calendar'].includes(view)
                    ? 'bg-gray-100 dark:bg-white text-slate-900 dark:text-slate-900'
                    : 'text-slate-800 dark:text-slate-300'}`}
                aria-label="Tasks"
                onClick={() => setView('board')}
              >
                <ListChecks className={`w-5 h-5 ${['board', 'list', 'calendar'].includes(view)
                  ? 'text-slate-900 dark:text-slate-900'
                  : 'text-slate-800 dark:text-slate-300'}`} />
                <span>My Tasks</span>
              </Button>
              <Button
                variant={view === 'projects' ? 'secondary' : 'ghost'}
                className={`w-full flex items-center gap-3 px-4 justify-start text-base font-medium
                  ${view === 'projects'
                    ? 'bg-gray-100 dark:bg-white text-slate-900 dark:text-slate-900'
                    : 'text-slate-800 dark:text-slate-300'}`}
                aria-label="Projects"
                onClick={() => setView('projects')}
              >
                <Folder className={`w-5 h-5 ${view === 'projects'
                  ? 'text-slate-900 dark:text-slate-900'
                  : 'text-slate-800 dark:text-slate-300'}`} />
                <span>Projects</span>
              </Button>
            </CardContent>
          </Card>
        </aside>
        {/* Main Landing Content */}
        <section className="flex-1 flex flex-col items-start justify-start w-full">
          <div className="max-w-2xl w-full mt-[14px]">
            
            {/* Show Tabs and project selector only for Tasks */}
            {view === 'board' || view === 'list' || view === 'calendar' ? (
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
                {/* View Content */}
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
            ) : (
              <div className="w-full text-center text-slate-500 dark:text-slate-300 py-12 border rounded-md bg-slate-50 dark:bg-slate-900">
                <span>📁 Project management coming soon...</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
