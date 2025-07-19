import { AlertTriangle, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { TaskStatus } from '@fullstack/common';

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dotClass?: string; icon?: any }> = {
  [TaskStatus.TODO]: { label: 'To Do', color: '#f59e42', dotClass: 'bg-amber-400', icon: Circle },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: '#2563eb', dotClass: 'bg-blue-600', icon: Loader2 },
  [TaskStatus.DONE]: { label: 'In Review', color: '#10b981', dotClass: 'bg-emerald-500', icon: CheckCircle2 },
  [TaskStatus.CLOSE]: { label: 'Done', color: '#a3a3a3', dotClass: 'bg-gray-400', icon: AlertTriangle },
};
