import { useEffect, useMemo, useState, useCallback } from 'react';

import { LabelSetResDto, TaskResDto, TaskSortField, TaskSortOrder, TaskStatus } from '@fullstack/common';
import { Check, Plus, X } from 'lucide-react';

import LabelBadge from '@/components/common/LabelBadge';
import UserSelector from '@/components/common/UserSelector';
import { Badge } from '@/components/ui-kit/Badge';
import { Button } from '@/components/ui-kit/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui-kit/Dropdown-menu';
import { Input } from '@/components/ui-kit/Input';
import { Label } from '@/components/ui-kit/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-kit/Select';
import { useWebStorage } from '@/hooks/useWebStorage';
import { useAuth } from '@/providers/AuthProvider';
import { useLabelStore } from '@/stores/useLabelStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import { statusColors, statusIcons, statusLabels, allStatuses } from '@/consts/taskStatusConfig';
import { withToast } from '@/utils/toastUtils';

import EditableTaskTableRow from './EditableTaskTableRow';
import TaskTableGroupByControl from './TaskTableGroupByControl';
import TaskTableHeader from './TaskTableHeader';
import {
  getDefaultTaskTableColumnWidths,
  getTaskTableColumnWidthStorageKey,
  getTaskTableGridTemplateColumns,
  getTaskTableMinWidth,
  getTaskTableTitleAutoWidthStorageKey,
  resizeTaskTableColumn,
  sanitizeTaskTableColumnWidths,
  TaskTableColumnId,
  TaskTableColumnWidths,
} from './taskTableColumnSizing';

interface TableViewProps {
  tasks: TaskResDto[];
  scopeProjectId: string | 'all' | null;
  storageScopeKey: string;
  onOpenTask: (taskId: string) => void;
}

const sectionActionGutterClassName = 'w-5 shrink-0';
const UNASSIGNED_SECTION_TITLE = 'Unassigned';

type TaskTableLikeLabel = {
  id: string;
  labelName?: string;
  name?: string;
};

type TaskTableLikeTask = {
  id: string;
  labels?: TaskTableLikeLabel[];
};

type TaskTableLikeLabelSet = {
  id: string;
  name?: string;
  labelSetName?: string;
  labels?: TaskTableLikeLabel[];
} | null;

export interface TaskTableSection {
  key: string;
  title: string | null;
  taskIds: string[];
  isUngrouped: boolean;
}

interface CreateTaskTableSectionsOptions {
  tasks: TaskTableLikeTask[];
  labelSet: TaskTableLikeLabelSet;
}

export function createTaskTableSections({ tasks, labelSet }: CreateTaskTableSectionsOptions): TaskTableSection[] {
  if (!labelSet) {
    return [
      {
        key: 'all-tasks',
        title: null,
        taskIds: tasks.map((task) => task.id),
        isUngrouped: true,
      },
    ];
  }

  const labels = Array.isArray(labelSet.labels) ? labelSet.labels : [];
  const labelIds = new Set(labels.map((label) => label.id));
  const sections = labels.map<TaskTableSection>((label) => ({
    key: `label:${label.id}`,
    title: label.name ?? label.labelName ?? '',
    taskIds: [],
    isUngrouped: false,
  }));

  const sectionByLabelId = new Map(sections.map((section, index) => [labels[index].id, section]));
  const unassignedSection: TaskTableSection = {
    key: 'unassigned',
    title: UNASSIGNED_SECTION_TITLE,
    taskIds: [],
    isUngrouped: false,
  };

  for (const task of tasks) {
    const matchingLabel = (task.labels ?? []).find((label) => labelIds.has(label.id));
    if (!matchingLabel) {
      unassignedSection.taskIds.push(task.id);
      continue;
    }

    const targetSection = sectionByLabelId.get(matchingLabel.id);
    if (targetSection) {
      targetSection.taskIds.push(task.id);
    } else {
      unassignedSection.taskIds.push(task.id);
    }
  }

  return [...sections, unassignedSection];
}

interface InlineTaskCreateRowProps {
  columnWidths: TaskTableColumnWidths;
  titleAutoWidth: boolean;
  scopeProjectId: string | 'all' | null;
  initialStatus: TaskStatus;
  labelIds?: string[];
  onCancel: () => void;
  onCreated: () => void;
}

function normalizeProjectScope(scopeProjectId: string | 'all' | null): string | null | undefined {
  if (scopeProjectId === 'all') return undefined;
  if (scopeProjectId === 'personal') return null;
  return scopeProjectId;
}

function InlineTaskCreateRow({ columnWidths, titleAutoWidth, scopeProjectId, initialStatus, labelIds = [], onCancel, onCreated }: InlineTaskCreateRowProps) {
  const { user } = useAuth();
  const { projects, currentProject } = useProjectStore();
  const { createTask } = useTaskStore();
  const normalizedProjectId = normalizeProjectScope(scopeProjectId);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [assignedTo, setAssignedTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assigneeOptions = useMemo(() => {
    if (scopeProjectId === 'all') return [] as Array<{ value: string; label: string }>;

    if (normalizedProjectId == null) {
      return user?.id
        ? [{ value: String(user.id), label: String(user.name || 'Me') }]
        : [];
    }

    const project = currentProject?.id === normalizedProjectId
      ? currentProject
      : projects.find((candidate) => String(candidate.id) === String(normalizedProjectId));
    const members = Array.isArray(project?.members) ? project.members : [];
    const options = members.map((member: any) => ({
      value: String(member.id),
      label: String(member.name || member.id),
    }));

    if (user?.id && !options.some((option) => option.value === String(user.id))) {
      options.unshift({
        value: String(user.id),
        label: String(user.name || 'Me'),
      });
    }

    return options;
  }, [currentProject, normalizedProjectId, projects, scopeProjectId, user]);

  useEffect(() => {
    if (assigneeOptions.length === 0) {
      setAssignedTo('');
      return;
    }

    const selfOption = user?.id ? assigneeOptions.find((option) => option.value === String(user.id)) : null;
    const nextAssignee = selfOption?.value ?? assigneeOptions[0].value;

    setAssignedTo((current) => (assigneeOptions.some((option) => option.value === current) ? current : nextAssignee));
  }, [assigneeOptions, user]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const canCreate = title.trim().length > 0 && assignedTo.length > 0 && !!user?.id && !isSubmitting;
  const selectedAssignee = assignedTo
    ? assigneeOptions.find((option) => option.value === assignedTo) ?? null
    : null;

  const handleCreate = useCallback(async () => {
    if (!canCreate || !user?.id) return;

    setIsSubmitting(true);
    const createdTask = await withToast(
      async () => createTask({
        title: title.trim(),
        description: '',
        dueDate: '',
        status,
        assignedTo,
        projectId: normalizedProjectId ?? '',
        labelIds,
        createdBy: String(user.id),
      }),
      {
        success: 'Task created successfully!',
        error: 'Failed to create task.',
      }
    );
    setIsSubmitting(false);

    if (!createdTask) return;
    onCreated();
  }, [assignedTo, canCreate, createTask, labelIds, normalizedProjectId, onCreated, status, title, user]);

  return (
    <div
      className="grid min-h-14 items-center bg-transparent text-sm"
      style={{
        gridTemplateColumns: getTaskTableGridTemplateColumns(columnWidths, { titleAutoWidth }),
        minWidth: getTaskTableMinWidth(columnWidths),
      }}
    >
      <div className="px-3 py-2">
        <UserSelector
          options={assigneeOptions.map((option) => ({
            ...option,
            avatarText: option.label.charAt(0).toUpperCase(),
          }))}
          currentValue={selectedAssignee ? { id: selectedAssignee.value, name: selectedAssignee.label } : null}
          onSelect={(userId) => {
            if (isSubmitting) return;
            setAssignedTo(userId);
          }}
          triggerLabelClassName="font-normal"
        />
      </div>

      <div className="min-w-0 pr-3">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleCreate();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          className="h-8 w-full rounded-md border-transparent bg-transparent px-3 py-0 text-sm font-normal shadow-none focus-visible:border-input focus-visible:ring-0"
          placeholder="Task title"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge variant="outline" className={`cursor-pointer border ${statusColors[status]}`}>
              {statusIcons[status]}
              {statusLabels[status]}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {allStatuses.map((statusOption) => (
              <DropdownMenuRadioItem
                key={statusOption}
                value={statusOption}
                onSelect={() => {
                  if (isSubmitting) return;
                  setStatus(statusOption);
                }}
                className="relative flex cursor-pointer items-center pl-8"
              >
                {status === statusOption && <Check className="absolute left-2 h-4 w-4 text-primary" />}
                <div className="flex items-center gap-2">
                  {statusIcons[statusOption]}
                  {statusLabels[statusOption]}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-3 py-2 text-muted-foreground">
        <span className="min-w-0 truncate">Draft</span>
      </div>

      <div className="flex items-center justify-center gap-1 px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full text-emerald-600 transition-[background-color,color,opacity] hover:bg-emerald-500/10 hover:text-emerald-700 disabled:text-muted-foreground"
          onClick={handleCreate}
          disabled={!canCreate}
          aria-label="Create task"
          title="Create task"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full text-muted-foreground transition-[background-color,color,opacity] hover:bg-muted hover:text-foreground"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cancel task creation"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TableView({ tasks, scopeProjectId, storageScopeKey, onOpenTask }: TableViewProps) {
  const { currentDisplayViewConfig } = useTaskViewStore();
  const { fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();
  const defaultColumnWidths = useMemo(() => getDefaultTaskTableColumnWidths(), []);
  const [createRowSectionKey, setCreateRowSectionKey] = useState<string | null>(null);

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

  const inlineCreateInitialStatus = useMemo(() => {
    const statusFilter = currentDisplayViewConfig.status ?? [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
    if (statusFilter.includes(TaskStatus.TODO)) {
      return TaskStatus.TODO;
    }

    return statusFilter[0] ?? TaskStatus.TODO;
  }, [currentDisplayViewConfig.status]);

  const inlineCreateDisabled = scopeProjectId === 'all';

  useEffect(() => {
    setCreateRowSectionKey(null);
  }, [currentDisplayViewConfig.groupByLabelSetId, scopeProjectId]);

  const handleColumnResize = (columnId: TaskTableColumnId, width: number) => {
    if (columnId === 'title') {
      setTitleAutoWidth(false);
    }
    setStoredWidths((current) => resizeTaskTableColumn(sanitizeTaskTableColumnWidths(current), columnId, width));
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <TaskTableGroupByControl scopeProjectId={scopeProjectId} storageScopeKey={storageScopeKey} />
      {inlineCreateDisabled && (
        <div className="px-1 text-xs text-muted-foreground">
          Select a concrete project or personal scope to create inline.
        </div>
      )}

      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No tasks found.
          </div>
        ) : sections.map((section) => {
          const sectionTasks = section.taskIds.map((taskId) => taskById.get(taskId)).filter(Boolean) as TaskResDto[];
          const showSectionTitle = !section.isUngrouped || currentDisplayViewConfig.groupByLabelSetId;
          const sectionLabel = groupedLabelBySectionKey.get(section.key);
          const isCreateRowOpen = createRowSectionKey === section.key;
          const createRowLabelIds = sectionLabel?.id ? [sectionLabel.id] : [];
          return (
            <section key={section.key} className="flex flex-col gap-2">
              {showSectionTitle && section.title && (
                <div className="flex items-center gap-2 px-1">
                  {sectionLabel ? (
                    <LabelBadge text={sectionLabel.name} color={sectionLabel.color} className="px-2.5! py-1! text-xs" />
                  ) : (
                    <Badge variant="outline" className="px-2.5 py-1 text-xs font-normal text-muted-foreground shadow-none">
                      {section.title}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{section.taskIds.length}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-none bg-background dark:bg-muted/65">
                <div className="border-b border-border bg-muted/40">
                  <div className="flex items-center px-4">
                    <div className={`${sectionActionGutterClassName} flex items-center justify-center`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => setCreateRowSectionKey(section.key)}
                        disabled={inlineCreateDisabled || isCreateRowOpen}
                        aria-label={`Add task to ${section.title ?? 'table'}`}
                        title="Add task"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-fit">
                        <TaskTableHeader columnWidths={columnWidths} titleAutoWidth={titleAutoWidth} onColumnResize={handleColumnResize} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex px-4">
                  <div className={sectionActionGutterClassName} />
                  <div className="overflow-x-auto">
                    <div className="min-w-fit">
                      {sectionTasks.length > 0 || isCreateRowOpen ? (
                        <div className="divide-y divide-border">
                          {isCreateRowOpen && (
                            <InlineTaskCreateRow
                              columnWidths={columnWidths}
                              titleAutoWidth={titleAutoWidth}
                              scopeProjectId={scopeProjectId}
                              initialStatus={inlineCreateInitialStatus}
                              labelIds={createRowLabelIds}
                              onCancel={() => setCreateRowSectionKey((current) => (current === section.key ? null : current))}
                              onCreated={() => setCreateRowSectionKey((current) => (current === section.key ? null : current))}
                            />
                          )}
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
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          {section.title === UNASSIGNED_SECTION_TITLE ? 'No unassigned tasks.' : 'No tasks in this group yet.'}
                        </div>
                      )}
                    </div>
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