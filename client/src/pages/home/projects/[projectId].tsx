import { useParams } from "react-router-dom";
import { Card } from "@/components/ui-kit/Card";


export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <Card className="h-full w-full">
      <span>Project ID: {projectId}</span>
      {/* Add more project details here */}
    </Card>
  );
}
