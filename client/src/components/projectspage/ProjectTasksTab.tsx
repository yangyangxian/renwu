import BoardView from '@/components/taskspage/BoardView';
import { useTaskStore } from '@/stores/useTaskStore';

interface ProjectTasksTabProps {
  onTaskClick: (taskId: string) => void;
}

export function ProjectTasksTab({ onTaskClick }: ProjectTasksTabProps) {
  const { projectTasks: tasks } = useTaskStore();

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      <BoardView
        tasks={tasks}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
