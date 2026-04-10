import { useCallback, useEffect, useMemo, useState } from 'react';

import { TaskResDto, TaskStatus } from '@fullstack/common';
import { format } from 'date-fns';
import { Check, PanelRightOpen } from 'lucide-react';
import { toast } from 'sonner';

import UserSelector from '@/components/common/UserSelector';
import { Badge } from '@/components/ui-kit/Badge';
import { Button } from '@/components/ui-kit/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui-kit/Dropdown-menu';
import { Input } from '@/components/ui-kit/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { statusColors, statusIcons, statusLabels, allStatuses } from '@/consts/taskStatusConfig';
import { getTaskTableGridTemplateColumns, getTaskTableMinWidth, type TaskTableColumnWidths } from '@/utils/taskTableColumnSizing';

interface EditableTaskTableRowProps {
  task: TaskResDto;
  columnWidths: TaskTableColumnWidths;
  onOpenDetail: (taskId: string) => void;
}

const titleFieldClassName = 'h-8 w-full rounded-md border border-transparent bg-transparent px-3 py-0 text-left text-sm font-normal leading-5 text-foreground shadow-none';

export default function EditableTaskTableRow({ task, columnWidths, onOpenDetail }: EditableTaskTableRowProps) {
  const { updateTaskById } = useTaskStore();
  const { currentProject, projects } = useProjectStore();
  const { user } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [assigneeDraft, setAssigneeDraft] = useState(task.assignedTo ?? null);
  const [statusDraft, setStatusDraft] = useState(task.status);

  useEffect(() => {
    if (!editingTitle) {
      setTitleDraft(task.title);
    }
  }, [editingTitle, task.title]);

  useEffect(() => {
    setAssigneeDraft(task.assignedTo ?? null);
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
      options.push({ value: '', label: 'Unassigned', avatarText: '-' });
      return options;
    }

    const project = currentProject?.id === task.projectId
      ? currentProject
      : projects.find((candidate) => String(candidate.id) === String(task.projectId));

    const members = Array.isArray(project?.members) ? project.members : [];
    const options = members.map((member: any) => ({
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

    if (!options.some((option) => option.value === '')) {
      options.push({ value: '', label: 'Unassigned', avatarText: '-' });
    }

    return options;
  }, [currentProject, projects, task.assignedTo, task.projectId, user]);

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
    const nextAssignee = userId ? { id: userId, name: memberOptions.find((option) => option.value === userId)?.label || '' } : null;
    setAssigneeDraft(nextAssignee as any);
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

  return (
    <div
      className="group relative grid min-h-14 items-center bg-background text-sm transition-colors hover:bg-muted/30"
      style={{
        gridTemplateColumns: getTaskTableGridTemplateColumns(columnWidths),
        minWidth: getTaskTableMinWidth(columnWidths),
      }}
    >
      <div className="min-w-0 py-2 pr-3">
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
        <UserSelector
          options={memberOptions}
          currentValue={assigneeDraft && (assigneeDraft as any).id ? assigneeDraft : null}
          onSelect={handleAssigneeSelect}
        />
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

      <div className="flex items-center justify-center px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onOpenDetail(task.id)}
          aria-label={`Open details for ${task.title}`}
          title="Open details"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}