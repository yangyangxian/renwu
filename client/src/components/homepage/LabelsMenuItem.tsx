import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui-kit/Sidebar";
import { Tag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { LABELS_PATH } from "@/routes/routeConfig";

export function LabelsMenuItem({ showText }: { showText: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const isActive = pathname === LABELS_PATH;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="relative flex items-center min-w-0 mb-1 group cursor-pointer"
        isActive={isActive}
        onClick={() => {
          const currentHash = location.hash;
          navigate(`${LABELS_PATH}${currentHash}`);
        }}
      >
        <Tag className="w-5 h-5 mr-1 flex-shrink-0" />
        {showText && <span>Labels</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
