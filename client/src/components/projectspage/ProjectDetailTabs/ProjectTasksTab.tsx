import BoardView from '@/components/taskspage/BoardView';
import { TaskResDto } from '@fullstack/common';

interface ProjectTasksTabProps {
  projectId: string;
  tasks: TaskResDto[];
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (taskId: string) => void;
}

export function ProjectTasksTab({ projectId, tasks, onTaskDelete, onTaskStatusChange, onTaskClick }: ProjectTasksTabProps) {
  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      <BoardView
        tasks={tasks}
        onTaskClick={onTaskClick}
        onTaskDelete={onTaskDelete}
        onTaskStatusChange={onTaskStatusChange}
      />
    </div>
  );
}
