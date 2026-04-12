export type TaskTableColumnId = 'title' | 'assignee' | 'status' | 'updatedAt' | 'actions';

export type TaskTableColumnWidths = Record<TaskTableColumnId, number>;

export const TASK_TABLE_COLUMN_ORDER: TaskTableColumnId[] = ['assignee', 'title', 'status', 'updatedAt', 'actions'];

type ColumnConstraint = {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
};

const COLUMN_CONSTRAINTS: Record<TaskTableColumnId, ColumnConstraint> = {
  title: {
    defaultWidth: 560,
    minWidth: 320,
    maxWidth: 700,
  },
  assignee: {
    defaultWidth: 170,
    minWidth: 140,
    maxWidth: 260,
  },
  status: {
    defaultWidth: 170,
    minWidth: 130,
    maxWidth: 220,
  },
  updatedAt: {
    defaultWidth: 190,
    minWidth: 160,
    maxWidth: 260,
  },
  actions: {
    defaultWidth: 116,
    minWidth: 108,
    maxWidth: 140,
  },
};

const COLUMN_IDS = Object.keys(COLUMN_CONSTRAINTS) as TaskTableColumnId[];

function clampColumnWidth(columnId: TaskTableColumnId, width: number): number {
  const { minWidth, maxWidth } = COLUMN_CONSTRAINTS[columnId];
  if (columnId === 'title') {
    return Math.max(width, minWidth);
  }
  return Math.min(Math.max(width, minWidth), maxWidth);
}

export function getDefaultTaskTableColumnWidths(): TaskTableColumnWidths {
  return COLUMN_IDS.reduce((accumulator, columnId) => {
    accumulator[columnId] = COLUMN_CONSTRAINTS[columnId].defaultWidth;
    return accumulator;
  }, {} as TaskTableColumnWidths);
}

export function resizeTaskTableColumn(currentWidths: TaskTableColumnWidths, columnId: TaskTableColumnId, nextWidth: number): TaskTableColumnWidths {
  return {
    ...currentWidths,
    [columnId]: clampColumnWidth(columnId, nextWidth),
  };
}

export function sanitizeTaskTableColumnWidths(input: unknown): TaskTableColumnWidths {
  const defaults = getDefaultTaskTableColumnWidths();
  const source = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};

  return COLUMN_IDS.reduce((accumulator, columnId) => {
    const candidate = source[columnId];
    accumulator[columnId] = typeof candidate === 'number' && Number.isFinite(candidate)
      ? clampColumnWidth(columnId, candidate)
      : defaults[columnId];
    return accumulator;
  }, {} as TaskTableColumnWidths);
}

export function getTaskTableColumnWidthStorageKey(scopeKey: string): string {
  return `task-table-widths:${scopeKey}`;
}

export function getTaskTableTitleAutoWidthStorageKey(scopeKey: string): string {
  return `task-table-title-auto:${scopeKey}`;
}

export function getTaskTableGridTemplateColumns(
  columnWidths: TaskTableColumnWidths,
  options?: { titleAutoWidth?: boolean },
): string {
  const titleTrack = options?.titleAutoWidth !== false
    ? `minmax(${columnWidths.title}px, ${COLUMN_CONSTRAINTS.title.maxWidth}px)`
    : `${columnWidths.title}px`;
  const trackByColumnId: Record<TaskTableColumnId, string> = {
    assignee: `${columnWidths.assignee}px`,
    title: titleTrack,
    status: `${columnWidths.status}px`,
    updatedAt: `${columnWidths.updatedAt}px`,
    actions: `${columnWidths.actions}px`,
  };

  return TASK_TABLE_COLUMN_ORDER.map((columnId) => trackByColumnId[columnId]).join(' ');
}

export function getTaskTableMinWidth(columnWidths: TaskTableColumnWidths): number {
  return columnWidths.title + columnWidths.assignee + columnWidths.status + columnWidths.updatedAt + columnWidths.actions;
}

export { COLUMN_CONSTRAINTS, COLUMN_IDS };