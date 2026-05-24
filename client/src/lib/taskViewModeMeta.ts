import { TaskViewMode } from '@fullstack/common';
import { CalendarDays, Kanban, List, Table2, type LucideIcon } from 'lucide-react';

export interface TaskViewModeMeta {
  label: string;
  icon: LucideIcon;
}

export const TASK_VIEW_MODE_ORDER: TaskViewMode[] = [
  TaskViewMode.BOARD,
  TaskViewMode.LIST,
  TaskViewMode.TABLE,
  TaskViewMode.TIMELINE,
];

const TASK_VIEW_MODE_META: Record<TaskViewMode, TaskViewModeMeta> = {
  [TaskViewMode.BOARD]: {
    label: 'Board',
    icon: Kanban,
  },
  [TaskViewMode.LIST]: {
    label: 'List',
    icon: Table2,
  },
  [TaskViewMode.TABLE]: {
    label: 'Table',
    icon: List,
  },
  [TaskViewMode.TIMELINE]: {
    label: 'Timeline',
    icon: CalendarDays,
  },
};

export function getTaskViewModeMeta(viewMode: TaskViewMode): TaskViewModeMeta {
  return TASK_VIEW_MODE_META[viewMode];
}