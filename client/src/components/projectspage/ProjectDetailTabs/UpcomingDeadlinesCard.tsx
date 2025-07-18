import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { Label } from '@/components/ui-kit/Label';
import { Card } from '@/components/ui-kit/Card';
import { TaskResDto } from '@fullstack/common';
import logger from '@/utils/logger';


// Helper to get days left from today
function getDaysLeft(dueDate: string | Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  now.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Status icon mapping (match task dialog select)
const statusIconConfig: Record<string, { icon: any; color: string; title: string }> = {
  TODO: { icon: Circle, color: 'text-amber-400', title: 'To Do' },
  IN_PROGRESS: { icon: Loader2, color: 'text-blue-500 animate-spin', title: 'In Progress' },
  DONE: { icon: CheckCircle2, color: 'text-emerald-500', title: 'Done' },
  CLOSE: { icon: AlertTriangle, color: 'text-gray-400', title: 'Closed' },
};

export function UpcomingDeadlinesCard({ tasks }: { tasks: TaskResDto[] }) {
  const now = new Date();
  logger.debug('UpcomingDeadlinesCard is rendering:');
  const sortedTasks = React.useMemo(() => {
    const validStatuses = ['TODO', 'IN_PROGRESS'];
    const allTasks = Array.isArray(tasks) ? tasks.filter(t => t.dueDate && validStatuses.includes((t.status || '').toUpperCase())) : [];
    const overdue = allTasks.filter(t => new Date(t.dueDate!) < now);
    const upcoming = allTasks.filter(t => new Date(t.dueDate!) >= now);
    return [
      ...overdue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
      ...upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    ].slice(0, 5);
  }, [tasks]);

  return (
    <Card className={"!p-3 flex-1 flex-col gap-2 overflow-y-auto"}>
      <div className="font-bold text-md pl-1">Upcoming Deadlines</div>
      <div className="flex flex-col gap-2 justify-center">
        {sortedTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No upcoming or overdue tasks.</div>
        ) : (
          sortedTasks.map((task) => {
            const daysLeft = getDaysLeft(task.dueDate!);
            const statusKey = (task.status || '').toUpperCase();
            const statusIcon = statusIconConfig[statusKey] || statusIconConfig.TODO;
            const isOverdue = new Date(task.dueDate!) < now;
            return (
              <div key={task.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-white-black">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className="text-sm text-primary truncate">{task.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    Assigned to: {task.assignedTo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end min-w-[60px] gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusIcon.color} bg-muted/60`}>{statusIcon.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {isOverdue
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
