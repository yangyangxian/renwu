import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ListChecks, Folder } from "lucide-react";
import { NavLink, useOutlet, useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, TASKS_PATH } from "@/routes/routeConfig";
import { useAuth } from "@/providers/AuthProvider";

export default function HomePage() {
  const { toggleDark } = useDarkMode();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // Only show landing content if not authenticated and at root path
  const showLanding = !isAuthenticated && location.pathname === "/";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col pt-16">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-black dark:border-2 shadow-md z-50 flex justify-between items-center h-16 px-5">
        <div className="flex items-center gap-6">
          <Button
            variant='secondary'
            className="text-xl font-bold shadow-none cursor-pointer bg-transparent hover:bg-transparent"
            onClick={() => navigate("/")}
            aria-label="Go to home"
            tabIndex={0}
          >
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Task manager
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">
            <svg className="w-5 h-5 dark:hidden" fill="none" stroke="#f59e42" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="5"/></svg>
            <svg className="w-5 h-5 hidden dark:inline" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Button>
          {isAuthenticated && (
            <Button variant="default" size="sm" onClick={logout}>Log Out</Button>
          )}
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex flex-1">
        {/* Sidebar with icon and text */}
        {isAuthenticated && (
          <aside>
            <Card className="w-48 h-[calc(100vh-6rem)] p-3 flex flex-col items-center gap-2 overflow-y-auto m-3">
              <CardContent className="flex flex-col gap-1 w-full p-0">
                <NavLink to={TASKS_PATH} className="w-full" end>
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
                <NavLink to={PROJECTS_PATH} className="w-full" end>
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
        )}
        {/* Main Landing Content or Outlet */}
        <section className="flex items-start justify-start w-full">
          <div className="w-full">
            {showLanding ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
                <span className="mb-4 text-center font-bold text-4xl">Welcome to Task Manager</span>
                <p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
                  Organize your tasks, manage your projects, and boost your productivity with a modern, collaborative task management app.
                </p>
                <div className="flex gap-4">
                  <Button onClick={() => navigate('/login')} size="lg">Log In</Button>
                  <Button onClick={() => navigate('/signup')} size="lg" variant="outline">Sign Up</Button>
                </div>
              </div>
            ) : (
                outlet
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
