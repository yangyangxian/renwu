import { useEffect, useMemo } from 'react';

import { LabelSetResDto, TaskResDto, TaskSortField, TaskSortOrder, TaskStatus } from '@fullstack/common';

import LabelBadge from '@/components/common/LabelBadge';
import { Badge } from '@/components/ui-kit/Badge';
import { Label } from '@/components/ui-kit/Label';
import { useWebStorage } from '@/hooks/useWebStorage';
import { useLabelStore } from '@/stores/useLabelStore';
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import {
  createTaskTableSections,
  UNASSIGNED_SECTION_TITLE,
} from '@/utils/taskTableGrouping';
import {
  getDefaultTaskTableColumnWidths,
  getTaskTableColumnWidthStorageKey,
  getTaskTableTitleAutoWidthStorageKey,
  resizeTaskTableColumn,
  sanitizeTaskTableColumnWidths,
  TaskTableColumnId,
} from '@/utils/taskTableColumnSizing';

import EditableTaskTableRow from './EditableTaskTableRow';
import TaskTableGroupByControl from './TaskTableGroupByControl';
import TaskTableHeader from './TaskTableHeader';

interface TableViewProps {
  tasks: TaskResDto[];
  scopeProjectId: string | 'all' | null;
  storageScopeKey: string;
  onOpenTask: (taskId: string) => void;
}

function normalizeProjectScope(scopeProjectId: string | 'all' | null): string | null | undefined {
  if (scopeProjectId === 'all') return undefined;
  if (scopeProjectId === 'personal') return null;
  return scopeProjectId;
}

export default function TableView({ tasks, scopeProjectId, storageScopeKey, onOpenTask }: TableViewProps) {
  const { currentDisplayViewConfig } = useTaskViewStore();
  const { fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();
  const defaultColumnWidths = useMemo(() => getDefaultTaskTableColumnWidths(), []);

  const storageKey = getTaskTableColumnWidthStorageKey(storageScopeKey);
  const titleAutoStorageKey = getTaskTableTitleAutoWidthStorageKey(storageScopeKey);
  const [storedWidths, setStoredWidths] = useWebStorage(storageKey, defaultColumnWidths);
  const [titleAutoWidth, setTitleAutoWidth] = useWebStorage(titleAutoStorageKey, true);

  const columnWidths = useMemo(() => {
    const sanitizedWidths = sanitizeTaskTableColumnWidths(storedWidths);
    if (titleAutoWidth) {
      return {
        ...sanitizedWidths,
        title: defaultColumnWidths.title,
      };
    }

    return sanitizedWidths;
  }, [defaultColumnWidths, storedWidths, titleAutoWidth]);

  const normalizedProjectId = normalizeProjectScope(scopeProjectId);
  const scopedLabelSets = getLabelSetsForProjectId(normalizedProjectId) as LabelSetResDto[];

  useEffect(() => {
    if (scopeProjectId === 'all') return;
    fetchLabelSets(normalizedProjectId ?? undefined, { setActiveScope: false });
  }, [fetchLabelSets, normalizedProjectId, scopeProjectId]);

  const selectedLabelSet = currentDisplayViewConfig.groupByLabelSetId
    ? scopedLabelSets.find((labelSet) => labelSet.id === currentDisplayViewConfig.groupByLabelSetId) ?? null
    : null;

  const filteredTasks = useMemo(() => {
    const statusFilter = currentDisplayViewConfig.status ?? [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
    if (!statusFilter.length) return tasks;
    return tasks.filter((task) => statusFilter.includes(task.status));
  }, [currentDisplayViewConfig.status, tasks]);

  const sortedTasks = useMemo(() => {
    const sortField = currentDisplayViewConfig.sortField ?? TaskSortField.DUE_DATE;
    const sortOrder = currentDisplayViewConfig.sortOrder ?? TaskSortOrder.ASC;
    const next = filteredTasks.slice();
    next.sort((left, right) => {
      let result = 0;
      if (sortField === TaskSortField.DUE_DATE) {
        if (!left.dueDate && !right.dueDate) result = 0;
        else if (!left.dueDate) result = 1;
        else if (!right.dueDate) result = -1;
        else result = new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      } else if (sortField === TaskSortField.UPDATE_DATE) {
        if (!left.updatedAt && !right.updatedAt) result = 0;
        else if (!left.updatedAt) result = 1;
        else if (!right.updatedAt) result = -1;
        else result = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      } else {
        result = left.title.localeCompare(right.title);
      }

      return sortOrder === TaskSortOrder.ASC ? result : -result;
    });
    return next;
  }, [currentDisplayViewConfig.sortField, currentDisplayViewConfig.sortOrder, filteredTasks]);

  const sections = useMemo(
    () => createTaskTableSections({ tasks: sortedTasks, labelSet: selectedLabelSet }),
    [selectedLabelSet, sortedTasks]
  );

  const groupedLabelBySectionKey = useMemo(
    () => new Map((selectedLabelSet?.labels ?? []).map((label) => [`label:${label.id}`, label])),
    [selectedLabelSet]
  );

  const taskById = useMemo(
    () => new Map(sortedTasks.map((task) => [task.id, task])),
    [sortedTasks]
  );

  const handleColumnResize = (columnId: TaskTableColumnId, width: number) => {
    if (columnId === 'title') {
      setTitleAutoWidth(false);
    }
    setStoredWidths((current) => resizeTaskTableColumn(sanitizeTaskTableColumnWidths(current), columnId, width));
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <TaskTableGroupByControl scopeProjectId={scopeProjectId} storageScopeKey={storageScopeKey} />

      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {sortedTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No tasks found.
          </div>
        ) : sections.map((section) => {
          const sectionTasks = section.taskIds.map((taskId) => taskById.get(taskId)).filter(Boolean) as TaskResDto[];
          const showSectionTitle = !section.isUngrouped || currentDisplayViewConfig.groupByLabelSetId;
          const sectionLabel = groupedLabelBySectionKey.get(section.key);
          return (
            <section key={section.key} className="flex flex-col gap-2">
              {showSectionTitle && section.title && (
                <div className="flex items-center gap-2 px-1">
                  {sectionLabel ? (
                    <LabelBadge text={sectionLabel.name} color={sectionLabel.color} className="!px-2.5 !py-1 text-xs" />
                  ) : (
                    <Badge variant="outline" className="px-2.5 py-1 text-xs font-normal text-muted-foreground shadow-none">
                      {section.title}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{section.taskIds.length}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <div className="border-b border-border bg-muted/40">
                  <div className="overflow-x-auto px-4">
                    <div className="min-w-fit">
                      <TaskTableHeader columnWidths={columnWidths} titleAutoWidth={titleAutoWidth} onColumnResize={handleColumnResize} />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto px-4">
                  <div className="min-w-fit">
                    {sectionTasks.length > 0 ? (
                      <div className="divide-y divide-border">
                        {sectionTasks.map((task) => (
                          <EditableTaskTableRow
                            key={task.id}
                            task={task}
                            columnWidths={columnWidths}
                            titleAutoWidth={titleAutoWidth}
                            onOpenDetail={onOpenTask}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-sm text-muted-foreground">
                        {section.title === UNASSIGNED_SECTION_TITLE ? 'No unassigned tasks.' : 'No tasks in this group yet.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}