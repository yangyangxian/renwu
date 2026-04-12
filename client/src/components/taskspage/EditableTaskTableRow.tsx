import { useCallback, useEffect, useMemo, useState } from 'react';

import { LabelSetResDto, TaskResDto, TaskStatus } from '@fullstack/common';
import { format } from 'date-fns';
import { ArrowRightLeft, Check, PanelRightOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import LabelBadge from '@/components/common/LabelBadge';
import UserSelector from '@/components/common/UserSelector';
import { Badge } from '@/components/ui-kit/Badge';
import { Button } from '@/components/ui-kit/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui-kit/Dropdown-menu';
import { Input } from '@/components/ui-kit/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-kit/Tooltip';
import { useAuth } from '@/providers/AuthProvider';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { statusColors, statusIcons, statusLabels, allStatuses } from '@/consts/taskStatusConfig';
import { withToast } from '@/utils/toastUtils';
import { getTaskTableGridTemplateColumns, getTaskTableMinWidth, type TaskTableColumnWidths } from './taskTableColumnSizing';

interface EditableTaskTableRowProps {
  task: TaskResDto;
  columnWidths: TaskTableColumnWidths;
  titleAutoWidth: boolean;
  onOpenDetail: (taskId: string) => void;
  groupingLabelSet?: LabelSetResDto | null;
  onMoveTaskToGroup?: (task: TaskResDto, targetLabelId: string | null) => Promise<void>;
}

interface TaskAssigneeOption {
  id: string;
  name?: string;
}

interface TaskProjectMemberOption {
  id: string;
  name?: string;
}

const titleFieldClassName = 'h-8 w-full rounded-md border border-transparent bg-transparent px-3 py-0 text-left text-sm font-normal leading-5 text-foreground shadow-none';

export default function EditableTaskTableRow({ task, columnWidths, titleAutoWidth, onOpenDetail, groupingLabelSet = null, onMoveTaskToGroup }: EditableTaskTableRowProps) {
  const { updateTaskById, deleteTaskById } = useTaskStore();
  const { currentProject, projects } = useProjectStore();
  const { user } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [assigneeDraft, setAssigneeDraft] = useState<TaskAssigneeOption | null>(task.assignedTo?.id ? task.assignedTo : null);
  const [statusDraft, setStatusDraft] = useState(task.status);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isMovingTaskGroup, setIsMovingTaskGroup] = useState(false);

  useEffect(() => {
    if (!editingTitle) {
      setTitleDraft(task.title);
    }
  }, [editingTitle, task.title]);

  useEffect(() => {
    setAssigneeDraft(task.assignedTo?.id ? task.assignedTo : null);
  }, [task.assignedTo]);

  useEffect(() => {
    setStatusDraft(task.status);
  }, [task.status]);

  const memberOptions = useMemo(() => {
    if (!task.projectId) {
      const options = [] as { value: string; label: string; avatarText: string }[];
      if (user?.id) {
        options.push({
          value: String(user.id),
          label: String(user.name || 'Me'),
          avatarText: String(user.name || 'M').charAt(0).toUpperCase(),
        });
      }
      return options;
    }

    const project = currentProject?.id === task.projectId
      ? currentProject
      : projects.find((candidate) => String(candidate.id) === String(task.projectId));

    const members = Array.isArray(project?.members) ? project.members : [];
    const options = members.map((member: TaskProjectMemberOption) => ({
      value: String(member.id),
      label: String(member.name || member.id),
      avatarText: String(member.name || member.id).charAt(0).toUpperCase(),
    }));

    if (task.assignedTo?.id && !options.some((option) => option.value === String(task.assignedTo?.id))) {
      options.unshift({
        value: String(task.assignedTo.id),
        label: String(task.assignedTo.name || task.assignedTo.id),
        avatarText: String(task.assignedTo.name || task.assignedTo.id).charAt(0).toUpperCase(),
      });
    }

    return options;
  }, [currentProject, projects, task.assignedTo, task.projectId, user]);

  const groupingLabelIds = useMemo(
    () => new Set((groupingLabelSet?.labels ?? []).map((label) => label.id)),
    [groupingLabelSet]
  );

  const currentGroupingLabelId = useMemo(
    () => (task.labels ?? []).find((label) => groupingLabelIds.has(label.id))?.id ?? null,
    [groupingLabelIds, task.labels]
  );

  const moveTargets = useMemo(() => {
    if (!groupingLabelSet) return [] as Array<{ value: string | null; label: string; color?: string }>;

    const labelTargets: Array<{ value: string | null; label: string; color?: string }> = (groupingLabelSet.labels ?? [])
      .filter((label) => label.id !== currentGroupingLabelId)
      .map((label) => ({ value: label.id, label: label.name, color: label.color }));

    if (currentGroupingLabelId) {
      labelTargets.push({ value: null, label: 'Unassigned' });
    }

    return labelTargets;
  }, [currentGroupingLabelId, groupingLabelSet]);

  const commitTitle = useCallback(async () => {
    const nextTitle = titleDraft.trim();
    setEditingTitle(false);

    if (!nextTitle) {
      setTitleDraft(task.title);
      return;
    }

    if (nextTitle === task.title) {
      return;
    }

    try {
      await updateTaskById(task.id, { title: nextTitle });
    } catch {
      setTitleDraft(task.title);
      toast.error('Failed to update title');
    }
  }, [task.id, task.title, titleDraft, updateTaskById]);

  const handleAssigneeSelect = useCallback(async (userId: string) => {
    const previousAssignee = assigneeDraft;
    const nextAssignee: TaskAssigneeOption | null = userId
      ? { id: userId, name: memberOptions.find((option) => option.value === userId)?.label || '' }
      : null;
    setAssigneeDraft(nextAssignee);
    try {
      await updateTaskById(task.id, { assignedTo: userId || null });
    } catch {
      setAssigneeDraft(previousAssignee);
      toast.error('Failed to update assignee');
    }
  }, [assigneeDraft, memberOptions, task.id, updateTaskById]);

  const handleStatusSelect = useCallback(async (nextStatus: TaskStatus) => {
    const previousStatus = statusDraft;
    setStatusDraft(nextStatus);
    try {
      await updateTaskById(task.id, { status: nextStatus });
    } catch {
      setStatusDraft(previousStatus);
      toast.error('Failed to update status');
    }
  }, [statusDraft, task.id, updateTaskById]);

  const handleDeleteTask = useCallback(async () => {
    await withToast(
      async () => {
        await deleteTaskById(task.id);
      },
      {
        success: 'Task deleted successfully!',
        error: 'Failed to delete task.',
      }
    );
  }, [deleteTaskById, task.id]);

  const handleMoveTaskGroup = useCallback(async (targetLabelId: string | null) => {
    if (!onMoveTaskToGroup) return;

    setIsMovingTaskGroup(true);
    try {
      await onMoveTaskToGroup(task, targetLabelId);
    } finally {
      setIsMovingTaskGroup(false);
    }
  }, [onMoveTaskToGroup, task]);

  return (
    <div
      className="group relative grid min-h-14 items-center bg-transparent text-sm transition-colors hover:bg-muted/30 dark:hover:bg-muted/40"
      style={{
        gridTemplateColumns: getTaskTableGridTemplateColumns(columnWidths, { titleAutoWidth }),
        minWidth: getTaskTableMinWidth(columnWidths),
      }}
    >
      <div className="px-3 py-2">
        <UserSelector
          options={memberOptions}
          currentValue={assigneeDraft?.id ? assigneeDraft : null}
          onSelect={handleAssigneeSelect}
          triggerLabelClassName="font-normal"
        />
      </div>

      <div className="min-w-0 pr-3">
        {editingTitle ? (
          <Input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                (event.currentTarget as HTMLInputElement).blur();
              }
              if (event.key === 'Escape') {
                setEditingTitle(false);
                setTitleDraft(task.title);
              }
            }}
            className={`${titleFieldClassName} cursor-text focus-visible:border-input focus-visible:ring-0`}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className={`${titleFieldClassName} block max-w-full truncate hover:bg-muted/40 focus-visible:bg-muted/40`}
            onClick={() => setEditingTitle(true)}
          >
            {task.title}
          </button>
        )}
      </div>

      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge variant="outline" className={`cursor-pointer border ${statusColors[statusDraft]}`}>
              {statusIcons[statusDraft]}
              {statusLabels[statusDraft]}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {allStatuses.map((status) => (
              <DropdownMenuRadioItem
                key={status}
                value={status}
                onSelect={async () => {
                  await handleStatusSelect(status);
                }}
                className="relative flex cursor-pointer items-center pl-8"
              >
                {statusDraft === status && <Check className="absolute left-2 h-4 w-4 text-primary" />}
                <div className="flex items-center gap-2">
                  {statusIcons[status]}
                  {statusLabels[status]}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-3 py-2 text-muted-foreground">
        <span className="min-w-0 truncate">
          {task.updatedAt ? format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm') : '--'}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 px-2 py-2">
        {groupingLabelSet && moveTargets.length > 0 && onMoveTaskToGroup && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-full text-muted-foreground opacity-90 transition-[background-color,color,opacity] hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 dark:text-slate-200"
                    aria-label={`Move ${task.title} to another group`}
                    disabled={isMovingTaskGroup}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Move to</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {moveTargets.map((target) => (
                <DropdownMenuItem
                  key={target.value ?? 'unassigned'}
                  onSelect={() => {
                    void handleMoveTaskGroup(target.value);
                  }}
                  className="cursor-pointer"
                >
                  {target.value ? (
                    <LabelBadge text={target.label} color={target.color} className="pointer-events-none px-2.5! py-1!" />
                  ) : (
                    <Badge variant="outline" className="pointer-events-none px-2.5 py-1 text-xs font-normal text-muted-foreground shadow-none">
                      {target.label}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-muted-foreground opacity-90 transition-[color,opacity] hover:opacity-100 focus-visible:opacity-100 dark:text-slate-200"
              onClick={() => onOpenDetail(task.id)}
              aria-label={`Open details for ${task.title}`}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-muted-foreground opacity-90 transition-[background-color,color,opacity] hover:bg-destructive/10 hover:text-destructive hover:opacity-100 focus-visible:opacity-100 dark:text-slate-200"
              onClick={() => setDeleteDialogOpen(true)}
              aria-label={`Delete ${task.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Delete</TooltipContent>
        </Tooltip>
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => {
          setDeleteDialogOpen(false);
          handleDeleteTask();
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}