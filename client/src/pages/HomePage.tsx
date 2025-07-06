
import { useState } from "react";
import { Button } from "@/components/ui-kit/Button";
import { useAuth } from "@/providers/AuthProvider";
import { HomeSideBar } from "@/components/homepage/SideBar";
import { useOutlet, useNavigate, useLocation } from "react-router-dom";

export default function HomePage() {
  const outlet = useOutlet();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const showLanding = !isAuthenticated && location.pathname === "/";

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] pr-2">
      {/* Sidebar with icon and text */}
      {isAuthenticated && (
        <aside className="h-full flex flex-col">
          <HomeSideBar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
        </aside>
      )}
      {/* Main Landing Content or Outlet */}
      <section className="flex w-full max-h-full justify-center pl-3 p-2 pt-3">
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
      </section>
    </div>
  );
}
