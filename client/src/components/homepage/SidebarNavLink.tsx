import { Button } from "@/components/ui-kit/Button";
import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

interface SidebarNavLinkProps {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SidebarNavLink({ to, icon, children }: SidebarNavLinkProps) {
  return (
    <NavLink to={to} className="w-full" end>
      {({ isActive }) => (
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={`w-full flex items-center gap-3 px-4 justify-start text-base font-medium
            ${isActive
              ? 'bg-purple-400 dark:bg-purple-700 text-white hover:bg-primary-purple'
              : 'text-slate-800 dark:text-slate-300 hover:bg-muted dark:hover:bg-primary-foreground'}`}
          aria-label={typeof children === 'string' ? children : undefined}
        >
          {icon}
          <span>{children}</span>
        </Button>
      )}
    </NavLink>
  );
}
