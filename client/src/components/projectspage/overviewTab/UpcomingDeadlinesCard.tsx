import React from 'react';
import { TASK_STATUS_CONFIG } from './taskStatusConfig';
import { TaskStatus } from '@fullstack/common';
import { Card } from '@/components/ui-kit/Card';
import { TaskResDto } from '@fullstack/common';
import logger from '@/utils/logger';

function getDaysLeft(dueDate: string | Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  now.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}


interface UpcomingDeadlinesCardProps {
  tasks: TaskResDto[];
  className?: string;
}

export const UpcomingDeadlinesCard: React.FC<UpcomingDeadlinesCardProps> = ({ tasks, className }) => {
  const now = new Date();
  logger.debug('UpcomingDeadlinesCard is rendering:');
  const sortedTasks = React.useMemo(() => {
    const validStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
    const allTasks = Array.isArray(tasks) ? tasks.filter(t => t.dueDate && validStatuses.includes(t.status)) : [];
    const overdue = allTasks.filter(t => new Date(t.dueDate!) < now);
    const upcoming = allTasks.filter(t => new Date(t.dueDate!) >= now);
    return [
      ...overdue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
      ...upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    ].slice(0, 5);
  }, [tasks]);

  return (
    <Card className={`flex-1 flex-col gap-3 overflow-y-auto${className ? ` ${className}` : ''}`}>
      <div className="font-bold text-md pl-1">Upcoming Deadlines</div>
      <div className="flex flex-col gap-2 justify-center">
        {sortedTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No upcoming or overdue tasks.</div>
        ) : (
          sortedTasks.map((task) => {
            const daysLeft = getDaysLeft(task.dueDate!);
            const statusKey = task.status as TaskStatus;
            const statusIcon = TASK_STATUS_CONFIG[statusKey] || TASK_STATUS_CONFIG[TaskStatus.TODO];
            const isOverdue = new Date(task.dueDate!) < now;
            return (
              <div key={task.id} className="flex items-center gap-2 card-border px-3 py-2 bg-white-black">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className="text-sm text-primary truncate">{task.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    Assigned to: {task.assignedTo?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end min-w-[60px] gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize text-white ${statusIcon.dotClass}`}>{statusIcon.label}</span>                
                  <span className="text-xs mt-1 text-muted-foreground">
                    {daysLeft === 0
                      ? 'Today'
                      : isOverdue
                        ? `${Math.abs(daysLeft)} days overdue`
                        : `${daysLeft} days left`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
