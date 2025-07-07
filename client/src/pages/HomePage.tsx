
import { useState, useEffect } from "react";
import { Button } from "@/components/ui-kit/Button";
import { useAuth } from "@/providers/AuthProvider";
import { HomeSideBar } from "@/components/homepage/SideBar";
import { ProjectDialog } from "@/components/projectspage/ProjectDialog";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "@/utils/APIClient";
import { ProjectResDto } from '@fullstack/common';

export default function HomePage() {
  // No longer using useOutlet, will use <Outlet context={...} />
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Project list state
  const [projects, setProjects] = useState<ProjectResDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects for current user
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    apiClient.get<ProjectResDto[]>(`/api/projects/me`)
      .then(setProjects)
      .catch((err) => setError(err?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  // Dialog submit handler
  const handleDialogSubmit = async (project: { name: string; description: string }) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post<typeof project, ProjectResDto>(`/api/projects`, project);
      // Refresh project list
      const updated = await apiClient.get<ProjectResDto[]>(`/api/projects/me`);
      setProjects(updated);
      setProjectDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const showLanding = !isAuthenticated && location.pathname === "/";

  return (
    <div className="flex w-full h-full pr-2">
      {/* Sidebar with icon and text */}
      {isAuthenticated && (
        <aside className="h-full max-h-full flex flex-shrink-0 overflow-y-auto overflow-x-hidden bg-white-black">
          <HomeSideBar
            expanded={sidebarExpanded}
            setExpanded={setSidebarExpanded}
            onAddProject={() => setProjectDialogOpen(true)}
            projects={projects}
          />
        </aside>
      )}
      {/* Main Landing Content or Outlet */}
      <section className="flex w-full max-h-full justify-center pl-3 p-2 pt-3">
        {projectDialogOpen && (
          <ProjectDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            onSubmit={handleDialogSubmit}
          />
        )}
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
          <Outlet context={{ projects }} />
        )}
      </section>
    </div>
  );
}
