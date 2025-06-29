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
              ? 'bg-gray-100 dark:bg-white text-slate-900 dark:text-slate-900'
              : 'text-slate-800 dark:text-slate-300'}`}
          aria-label={typeof children === 'string' ? children : undefined}
        >
          {icon}
          <span>{children}</span>
        </Button>
      )}
    </NavLink>
  );
}
