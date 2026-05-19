import { TaskViewMode } from '@fullstack/common';
import { Kanban, List, Table2, type LucideIcon } from 'lucide-react';

export interface TaskViewModeMeta {
  label: string;
  icon: LucideIcon;
}

export const TASK_VIEW_MODE_ORDER: TaskViewMode[] = [
  TaskViewMode.BOARD,
  TaskViewMode.LIST,
  TaskViewMode.TABLE,
];

const TASK_VIEW_MODE_META: Record<TaskViewMode, TaskViewModeMeta> = {
  [TaskViewMode.BOARD]: {
    label: 'Board',
    icon: Kanban,
  },
  [TaskViewMode.LIST]: {
    label: 'List',
    icon: List,
  },
  [TaskViewMode.TABLE]: {
    label: 'Table',
    icon: Table2,
  },
};

export function getTaskViewModeMeta(viewMode: TaskViewMode): TaskViewModeMeta {
  return TASK_VIEW_MODE_META[viewMode];
}