import BoardView from '@/components/taskspage/BoardView';
import TaskListView from '@/components/taskspage/TaskListView';
import { useTaskStore } from '@/stores/useTaskStore';

interface ProjectTasksTabProps {
  onTaskClick: (taskId: string) => void;
  view?: 'list' | 'board';
}

export function ProjectTasksTab({ onTaskClick, view = 'board' }: ProjectTasksTabProps) {
  const { projectTasks: tasks } = useTaskStore();

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      {view === 'board' ? (
        <BoardView
          tasks={tasks}
          onTaskClick={onTaskClick}
          showAssignedTo={true}
        />
      ) : (
        <TaskListView
          tasks={tasks}
          showAssignedTo={true}
        />
      )}
    </div>
  );
}
