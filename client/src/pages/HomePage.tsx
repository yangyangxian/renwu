import { useState, useEffect } from "react";
import { Button } from "@/components/ui-kit/Button";
import LandingPage from "./LandingPage";
import { useAuth } from "@/providers/AuthProvider";
import { HomeSideBar } from "@/components/homepage/SideBar";
import { ProjectDialog } from "@/components/projectspage/ProjectDialog";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "@/utils/APIClient";
import { useProjects } from '@/hooks/useProjects';
import { Input } from "@/components/ui-kit/Input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui-kit/Dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { updateMe } from "@/apiRequests/apiEndpoints";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setUser, logout } = useAuth();
  // Name dialog state
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  // Show name dialog if user is logged in and has no name
  useEffect(() => {
    if (isAuthenticated && user && (!user.name || user.name.trim() === "")) {
      setNameDialogOpen(true);
      setPendingName("");
    }
  }, [isAuthenticated, user]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingName.trim()) return;
    try {
      console.log("Updating user name:", pendingName.trim());
      const response = await apiClient.put(updateMe(), { name: pendingName.trim() });
      // Assume response is the updated user object
      const updatedUser = response as typeof user;
      setNameDialogOpen(false);
      setUser && setUser(updatedUser);
    } catch (err) {
      // Optionally show error
    }
  };

  // Sidebar expanded state is now managed internally by HomeSideBar
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Use custom hook for project logic
  const {
    projects,
    addProject,
    setProjects,
  } = useProjects();

  const handleProjectSubmit = async (project: { name: string; description: string }) => {
    try {
      const newProject = await addProject(project);
      setProjectDialogOpen(false);
      if (newProject && newProject.id) {
        navigate(`/projects/${newProject.id}`);
      }
    } catch (err: any) {
      // Optionally handle error
    }
  };

  const showLanding = !isAuthenticated && location.pathname === "/";
  if (showLanding) {
    return <LandingPage />;
  }

  return (
    <div className="flex w-full h-full">
      {/* Sidebar with icon and text */}
      {isAuthenticated && (
        <aside className="h-full max-h-full flex overflow-y-auto overflow-x-hidden bg-white-black">
          <HomeSideBar
            onAddProject={() => setProjectDialogOpen(true)}
            projects={projects}
          />
        </aside>
      )}
      {/* Main Content or Outlet */}
      <section className="flex w-full max-h-full pl-3 p-2 pt-3">
        {/* Name Dialog */}
        <Dialog open={nameDialogOpen} modal>
          <DialogContent 
            className="max-w-xs w-full flex flex-col gap-2 items-center"
            showCloseButton={false}
            // Prevent closing on outside click or Escape
            onInteractOutside={e => e.preventDefault()}
            onEscapeKeyDown={e => e.preventDefault()}
          >
            <DialogTitle>
              <VisuallyHidden>Set your name</VisuallyHidden>
            </DialogTitle>
            <span className="font-bold text-lg">Welcome! Please tell us your name.</span>
            <span className="text-sm text-muted-foreground text-center mb-5">Your friends will find you by your name.</span>
            <form onSubmit={handleNameSubmit} className="w-full flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Enter your name"
                value={pendingName}
                onChange={e => setPendingName(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" className="mt-5">Save</Button>
            </form>
            {/* Log out button for stuck users */}
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={logout}
            >
              Log out
            </Button>
          </DialogContent>
        </Dialog>
        {projectDialogOpen && (
          <ProjectDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            onSubmit={handleProjectSubmit}
          />
        )}
        <Outlet context={{ projects }} />
      </section>
    </div>
  );
}
