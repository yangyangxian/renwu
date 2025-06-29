import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, Folder } from "lucide-react";
import { NavLink, useOutlet, useNavigate, useLocation } from "react-router-dom";
import { PROJECTS_PATH, TASKS_PATH } from "@/routes/routeConfig";
import { useAuth } from "@/providers/AuthProvider";

export default function HomePage() {
  const outlet = useOutlet();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Only show landing content if not authenticated and at root path
  const showLanding = !isAuthenticated && location.pathname === "/";

  return (
    <>
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
    </>
  );
}
