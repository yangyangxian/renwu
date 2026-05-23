import { useParams } from "react-router-dom";
import TaskDetail from "@/components/taskspage/TaskDetail";
import { Card } from "@/components/ui-kit/Card";

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  if (!taskId) return <div className="p-8 text-center text-lg">Task not found.</div>;
  return (
    <Card className="m-3 flex w-full rounded-xl p-6 shadow-none">
      <div className="w-full max-w-7xl">
        <TaskDetail taskId={taskId} />
      </div>
    </Card>
  );
}
