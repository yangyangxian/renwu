import BoardView from '@/components/taskspage/BoardView';
import { TaskResDto } from '@fullstack/common';

interface ProjectTasksTabProps {
  projectId: string;
  tasks: TaskResDto[];
  onTaskClick: (taskId: string) => void;
}

export function ProjectTasksTab({ projectId, tasks, onTaskClick }: ProjectTasksTabProps) {
  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      <BoardView
        tasks={tasks}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
