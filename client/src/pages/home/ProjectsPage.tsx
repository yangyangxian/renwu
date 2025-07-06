import { Card } from "@/components/ui-kit/Card";
import { Outlet } from "react-router-dom";

export default function ProjectsPage() {
  return (
    <Card className="h-full w-full">
      <Outlet />
    </Card>
  );
}
