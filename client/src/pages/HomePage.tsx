import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ListChecks, Folder } from "lucide-react";
import { NavLink, useOutlet } from "react-router-dom";
import { Projects_PATH, Tasks_PATH } from "@/routes/routeConfig";

export default function HomePage() {
  const { toggleDark } = useDarkMode();
  const outlet = useOutlet();

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
            <svg className="w-5 h-5 dark:hidden" fill="none" stroke="#f59e42" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="5"/></svg>
            <svg className="w-5 h-5 hidden dark:inline" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1">
        {/* Sidebar with icon and text */}
        <aside>
          <Card className="w-48 h-[calc(100vh-6rem)] p-3 flex flex-col items-center gap-2 overflow-y-auto m-3">
            <CardContent className="flex flex-col gap-1 w-full p-0">
              <NavLink to={Tasks_PATH} className="w-full" end>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full flex items-center gap-3 px-4 justify-start text-base font-medium
                      ${isActive
                        ? 'bg-gray-100 dark:bg-white text-slate-900 dark:text-slate-900'
                        : 'text-slate-800 dark:text-slate-300'}`}
                    aria-label="Tasks"
                  >
                    <ListChecks className={`w-5 h-5 ${isActive
                      ? 'text-slate-900 dark:text-slate-900'
                      : 'text-slate-800 dark:text-slate-300'}`} />
                    <span>My Tasks</span>
                  </Button>
                )}
              </NavLink>
              <NavLink to={Projects_PATH} className="w-full" end>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full flex items-center gap-3 px-4 justify-start text-base font-medium
                      ${isActive
                        ? 'bg-gray-100 dark:bg-white text-slate-900 dark:text-slate-900'
                        : 'text-slate-800 dark:text-slate-300'}`}
                    aria-label="Projects"
                  >
                    <Folder className={`w-5 h-5 ${isActive
                      ? 'text-slate-900 dark:text-slate-900'
                      : 'text-slate-800 dark:text-slate-300'}`} />
                    <span>Projects</span>
                  </Button>
                )}
              </NavLink>
            </CardContent>
          </Card>
        </aside>
        {/* Main Landing Content */}
        <section className="flex-1 flex flex-col items-start justify-start w-full">
          <div className="max-w-2xl w-full mt-[14px]">
            {outlet || (
              <Card className="w-full">
                <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                  <LayoutDashboard className="w-12 h-12 text-primary mb-2" />
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to Task Manager</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
                    Organize your work, manage projects, and track tasks efficiently. Select <span className="font-semibold text-primary">My Tasks</span> or <span className="font-semibold text-primary">Projects</span> from the sidebar to get started. <br />
                    Enjoy a clean, modern interface with light & dark mode support.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
