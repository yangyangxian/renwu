import { ReactNode } from "react";
import { Button } from "@/components/ui-kit/Button";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui-kit/Dropdown-menu";
import { LayoutDashboard, User, Sun, Moon, Monitor } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { HomeSideBar } from "@/components/homepage/SideBar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { setDark, setLight, setSystem, mode } = useDarkMode();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  // Show sidebar on authenticated routes except explicit public marketing/auth pages
  const hideSidebarRoutes = ['/login', '/signup', '/landing'];
  const showSidebar = isAuthenticated && !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="bg-gray-100 dark:bg-black pt-14">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-primary-purple shadow-sm z-50 flex justify-between items-center h-14 px-2">
        <div className="flex items-center gap-6">
          <Button
            variant='default'
            className="text-xl font-bold text-white shadow-none cursor-pointer bg-transparent hover:bg-transparent"
            onClick={() => navigate("/")}
            aria-label="Go to home"
            tabIndex={0}
          >
            <LayoutDashboard className="w-6 h-6 text-white" />
            Renwu
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme dropdown: Dark / Light / Follow system */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme menu" className="group">
                <Sun className="w-5 h-5 dark:hidden text-orange-300" aria-hidden />
                <Moon className="w-5 h-5 hidden dark:inline text-blue-500" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={setDark} className="cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-500" />
                  <span>Dark</span>
                </div>
                {mode === 'dark' && <span className="text-primary-purple">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={setLight} className="cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span>Light</span>
                </div>
                {mode === 'light' && <span className="text-primary-purple">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={setSystem} className="cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Follow system</span>
                </div>
                {mode === 'system' && <span className="text-primary-purple">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Log out dropdown menu */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu" className="hover:border-none group">
                  <span className="sr-only">Open user menu</span>
                  <User className="w-5 h-5 text-white group-hover:text-black dark:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout} variant="destructive" className="cursor-pointer">
                    Log Out
                  </DropdownMenuItem>             
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex h-[calc(100vh-56px)]">
        {showSidebar && (
          <aside className="h-full flex overflow-y-auto overflow-x-hidden bg-white-black">
            <HomeSideBar />
          </aside>
        )}
        <div className="flex-1 h-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
