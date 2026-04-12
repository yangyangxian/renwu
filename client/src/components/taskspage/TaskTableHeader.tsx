import { useCallback } from 'react';

import { getTaskTableGridTemplateColumns, getTaskTableMinWidth, TASK_TABLE_COLUMN_ORDER, type TaskTableColumnId, type TaskTableColumnWidths } from './taskTableColumnSizing';

interface TaskTableHeaderProps {
  columnWidths: TaskTableColumnWidths;
  titleAutoWidth: boolean;
  onColumnResize: (columnId: TaskTableColumnId, width: number) => void;
}

const RESIZABLE_COLUMNS: TaskTableColumnId[] = ['title', 'assignee', 'status', 'updatedAt'];

const COLUMN_LABELS: Record<TaskTableColumnId, string> = {
  title: 'Title',
  assignee: 'Assignee',
  status: 'Status',
  updatedAt: 'Updated',
  actions: 'Actions',
};

export default function TaskTableHeader({ columnWidths, titleAutoWidth, onColumnResize }: TaskTableHeaderProps) {
  const handleResizeStart = useCallback((columnId: TaskTableColumnId, startWidth: number, startClientX: number) => {
    const handlePointerMove = (event: PointerEvent) => {
      onColumnResize(columnId, startWidth + event.clientX - startClientX);
    };

    const handlePointerUp = () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  }, [onColumnResize]);

  return (
    <div
      className="grid text-sm tracking-wide text-muted-foreground"
      style={{
        gridTemplateColumns: getTaskTableGridTemplateColumns(columnWidths, { titleAutoWidth }),
        minWidth: getTaskTableMinWidth(columnWidths),
      }}
    >
      {TASK_TABLE_COLUMN_ORDER.map((columnId) => (
        <div key={columnId} className={`relative flex min-h-10 items-center px-3 ${columnId === 'actions' ? 'justify-center' : ''}`}>
          <span>{COLUMN_LABELS[columnId]}</span>
          {RESIZABLE_COLUMNS.includes(columnId) && (
            <button
              type="button"
              aria-label={`Resize ${COLUMN_LABELS[columnId]} column`}
              className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none"
              onPointerDown={(event) => {
                event.preventDefault();
                handleResizeStart(columnId, columnWidths[columnId], event.clientX);
              }}
            >
              <span className="absolute top-1/2 right-0 h-5 w-px -translate-y-1/2 bg-border" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}