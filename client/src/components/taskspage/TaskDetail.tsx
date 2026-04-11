import LabelSelector from '@/components/common/LabelSelector';
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { format } from "date-fns";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioItem } from "@/components/ui-kit/Dropdown-menu";
import { Badge } from "@/components/ui-kit/Badge";
import { Label } from "@/components/ui-kit/Label";
import { MarkdownnEditor, MarkdownEditorHandle } from '@/components/common/editor/MarkdownEditor';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import { Tag, FolderOpen, User, Clock, FileText, CheckCircle, Check, RefreshCw, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import DateSelector from "@/components/common/DateSelector";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from '@/stores/useProjectStore';
import UserSelector from '@/components/common/UserSelector';
import { statusLabels, statusColors, statusIcons, allStatuses } from "@/consts/taskStatusConfig";
import { marked } from 'marked';
import { toast } from 'sonner';
import { motion } from "framer-motion";
import { resolveRenderableTaskDetail } from '@/utils/taskDetailState';

import {
  getTaskDetailIconButtonClassName,
  getTaskDetailIconClassName,
} from './taskDetailStyles';

interface TaskDetailProps {
  taskId: string;
  previewTask?: TaskResDto | null;
}

const fieldLabelContainerClass = "flex items-center gap-3 min-h-[44px]";
const fieldLabelClass = "font-medium min-w-[120px] flex items-center gap-2 mb-0 text-muted-foreground dark:text-white";
const descriptionSurfaceClass = "markdown-body w-full rounded border border-transparent !bg-muted/40 dark:!bg-muted/65 transition-colors";
const descriptionEditSurfaceClass = `${descriptionSurfaceClass} border-primary/30 ring-1 ring-primary/10 dark:border-primary/40 dark:ring-primary/15 !bg-background dark:!bg-muted/75`;
const descriptionScrollClass = "overflow-auto min-h-[200px] max-h-[600px] relative";
const descriptionPaddingClass = "px-3 py-2";
const descriptionContentClass = "task-detail-description-content w-full";
const taskDetailIconClass = getTaskDetailIconClassName();
const taskDetailIconButtonClass = getTaskDetailIconButtonClassName();

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, previewTask = null }) => {
  const { currentTask, updateTaskById, fetchCurrentTask, loading: loadingCurrentTask } = useTaskStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState<string>(currentTask?.title || "");
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(currentTask?.dueDate);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descViewRef = useRef<HTMLDivElement | null>(null);
  const descViewScrollRef = useRef<HTMLDivElement | null>(null);
  const descEditScrollRef = useRef<HTMLDivElement | null>(null);
  const descScrollTopRef = useRef(0);
  const lastTaskIdRef = useRef<string | null>(null);
  const [descContainerHeight, setDescContainerHeight] = useState<number | undefined>(undefined);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isDescEditorReady, setIsDescEditorReady] = useState(false);
  const task = resolveRenderableTaskDetail({ requestedTaskId: taskId, currentTask, previewTask });
  const { projects } = useProjectStore();

  // Optimistic labels state (component scope)
  const [localLabelIds, setLocalLabelIds] = useState<string[]>([]);

  const currentLabelIds = localLabelIds;
  // Normalize projectId: use `null` to indicate personal (no project), matching TaskDialog
  const projectId = task?.projectId ? task.projectId : null;

  useEffect(() => {
    if (!task || !Array.isArray(task.labels)) {
      setLocalLabelIds([]);
    } else {
      setLocalLabelIds((task.labels || []).map((l: any) => l.id));
    }
  }, [task]);

  const handleLabelsChange = async (next: string[]) => {
    if (!taskId) return;
    const previous = localLabelIds;
    // If selection didn't change, avoid unnecessary API call
    const prevSet = new Set(previous || []);
    const nextSet = new Set(next || []);
    let equal = prevSet.size === nextSet.size;
    if (equal) {
      for (const v of prevSet) {
        if (!nextSet.has(v)) { equal = false; break; }
      }
    }
    if (equal) return; // no change, skip

    // optimistic update
    setLocalLabelIds(next);
    try {
      await updateTaskById(taskId, { labels: next });
      toast.success('Labels updated');
    } catch (err) {
      // rollback
      setLocalLabelIds(previous);
      toast.error('Failed to update labels');
    }
  };

  useEffect(() => {
    if (!taskId) return;
    fetchCurrentTask(taskId);
  }, [taskId, fetchCurrentTask]);

  useEffect(() => {
    const nextTaskId = task?.id ?? null;
    const taskIdentityChanged = nextTaskId !== lastTaskIdRef.current;

    setLocalDueDate(task?.dueDate);

    if (!task) {
      if (taskIdentityChanged) {
        setDescInput("");
        setTitleInput("");
        setIsDescEditorReady(false);
        setEditingDesc(false);
        setEditingTitle(false);
      }
      lastTaskIdRef.current = nextTaskId;
      return;
    }

    if (taskIdentityChanged) {
      setDescInput(task.description || "");
      setTitleInput(task.title || "");
      setIsDescEditorReady(false);
      setEditingDesc(false);
      setEditingTitle(false);
      lastTaskIdRef.current = nextTaskId;
      return;
    }

    if (!editingDesc) {
      setDescInput(task.description || "");
    }

    if (!editingTitle) {
      setTitleInput(task.title || "");
    }

    lastTaskIdRef.current = nextTaskId;
  }, [task, editingDesc, editingTitle]);

  const saveTitle = async (value: string) => {
    if (!task) return;
    const newTitle = value.trim();
    if (newTitle === task.title) return;
    try {
      await updateTaskById(taskId, { title: newTitle });
      toast.success('Task title updated');
    } catch (err) {
      toast.error('Failed to update title');
      setTitleInput(task.title || "");
    }
  };

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    await saveTitle(titleInput);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // commit on Enter
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      // cancel on Escape
      setEditingTitle(false);
      setTitleInput(task?.title || "");
    }
  };

  const handleEditClick = () => {
    setEditingTitle(true);
    setTimeout(() => {
      const el = document.getElementById(`task-title-input-${taskId}`) as HTMLInputElement | null;
      el?.focus();
    }, 0);
  };

  const handleDescClick = () => {
    // capture current viewer height to avoid layout jumps when mounting editor
    const h = descViewRef.current?.clientHeight;
    if (h) setDescContainerHeight(h);
    descScrollTopRef.current = descViewScrollRef.current?.scrollTop ?? 0;
    setIsDescEditorReady(false);
    setEditingDesc(true);
  };

  useLayoutEffect(() => {
    if (!editingDesc) return;

    const restoreScrollPosition = () => {
      if (descEditScrollRef.current) {
        descEditScrollRef.current.scrollTop = descScrollTopRef.current;
      }
    };

    restoreScrollPosition();
    const frameA = window.requestAnimationFrame(() => {
      restoreScrollPosition();
      window.requestAnimationFrame(restoreScrollPosition);
    });
    const timeoutId = window.setTimeout(restoreScrollPosition, 0);

    return () => {
      window.cancelAnimationFrame(frameA);
      window.clearTimeout(timeoutId);
    };
  }, [editingDesc]);

  useLayoutEffect(() => {
    if (editingDesc || descContainerHeight === undefined) return;

    const frameId = window.requestAnimationFrame(() => {
      setDescContainerHeight(undefined);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editingDesc, descContainerHeight, descInput]);

  const handleSubmitDesc = async (newValue: string) => {
    setEditingDesc(false);
    setDescInput(newValue);
    if (!task) return;
    try {
      await updateTaskById(taskId, { description: newValue });
      toast.success('Task description updated');
    } catch {
      toast.error('Failed to update description');
      setDescInput(task.description || "");
    }
  };

  const renderedHtml: string = useMemo(() => {
    const out = marked.parse(descInput) as unknown;
    return typeof out === 'string' ? out : '';
  }, [descInput]);

  const renderDescriptionPreview = (interactive: boolean) => {
    if (descInput) {
      return (
        <div className={`${descriptionPaddingClass} ${descriptionContentClass}`}>
          <div className={descriptionContentClass} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      );
    }

    return (
      <div
        className={`${descriptionPaddingClass} min-h-[200px] !text-sm rounded text-muted-foreground italic flex items-start`}
        onClick={interactive ? handleDescClick : undefined}
      >
        Enter a task description… (Markdown supported!)
      </div>
    );
  };

  const memberOptions = useMemo(() => {
    if (!task?.projectId) return task?.assignedTo ? [{ value: String(task.assignedTo.id), label: String(task.assignedTo.name || task.assignedTo.id), avatarText: String(task.assignedTo.name || '').charAt(0).toUpperCase() }] : [{ value: '', label: 'Unassigned', avatarText: '-' }];
    const project = projects.find((p: any) => String(p.id) === String(task.projectId));
    if (!project || !Array.isArray(project.members)) {
      return task?.assignedTo ? [{ value: String(task.assignedTo.id), label: String(task.assignedTo.name || task.assignedTo.id), avatarText: String(task.assignedTo.name || '').charAt(0).toUpperCase() }] : [];
    }
    const opts = project.members.map((m: any) => ({ value: String(m.id), label: String(m.name || m.id), avatarText: String(m.name || '').charAt(0).toUpperCase() }));
    return opts;
  }, [projects, task]);

  const handleAssigneeSelect = useCallback(async (userId: string) => {
    if (!taskId) return;
    try {
      await updateTaskById(taskId, { assignedTo: userId || null });
      toast.success('Assignee updated');
    } catch (err) {
      console.error('Failed to update assignee', err);
      toast.error('Failed to update assignee');
    }
  }, [taskId, updateTaskById]);

  return (
      <>
      { task &&
      <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
      >
      <style>{`
        .task-detail-description-content :where(ul, ol) {
          padding-left: 1.5em;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .task-detail-description-content :where(ul ul, ul ol, ol ol, ol ul) {
          margin-top: 0;
          margin-bottom: 0;
        }

        .task-detail-description-content li > p {
          margin-top: 0;
          margin-bottom: 0;
        }

        .task-detail-description-content li + li {
          margin-top: .25em;
        }
      `}</style>
      {/* Title block above columns */}
      <div className="mb-5 ml-2">
        {/* restore larger title font and ensure the leading icon is visible in dark mode */}
        <div className="text-2xl font-bold flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {editingTitle ? (
              <Input
                id={`task-title-input-${taskId}`}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl! font-bold w-[min(60vw,900px)] min-w-[280px] px-2 py-1 leading-tight"
                autoFocus
              />
            ) : (
              <>
                <Label className="max-w-[900px] min-w-0 truncate mb-0 text-2xl dark:text-white">
                  {task.title}
                </Label>
                <Button
                  size="icon"
                  variant="ghost"
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                    // prevent label from receiving the focus on mousedown
                    e.stopPropagation();
                    (e.currentTarget as HTMLButtonElement).focus();
                  }}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  title="Edit title"
                  className={taskDetailIconButtonClass}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,11fr)_minmax(280px,5fr)] gap-6 px-3 w-full">
        {/* Left column: Description and future comments */}
        <div className="flex flex-col gap-4">
          {/* Labels selector (above description) */}
          <div className={fieldLabelContainerClass}>
            <div className="flex flex-col w-full">
              <Label className={fieldLabelClass}>
                <Tag className={taskDetailIconClass} />
                Labels:
              </Label>
              <div className="mt-4">
                <LabelSelector value={currentLabelIds} onChange={handleLabelsChange} projectId={projectId} />
              </div>
            </div>
          </div>
          {/* Description */}
          <div className="flex flex-col gap-3 min-h-[48px]">
            <div className="flex items-center justify-between">
              <Label className={fieldLabelClass}>
                <FileText className={taskDetailIconClass} />
                Description:
              </Label>
              <div className="ml-3 flex min-h-9 items-center gap-2">
                {editingDesc ? (
                  <>
                    {isDirty && <UnsavedChangesIndicator />}
                    <Button size="sm" variant="secondary" onClick={() => editorRef.current?.cancel()}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="default" disabled={!isDirty} onClick={() => editorRef.current?.save()}>
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={taskDetailIconButtonClass}
                    onClick={handleDescClick}
                    title="Edit description"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {editingDesc ? (
              <>
                <div
                  ref={descEditScrollRef}
                  className={`${descriptionEditSurfaceClass} ${descriptionScrollClass}`}
                  style={descContainerHeight ? { height: descContainerHeight } : undefined}
                >
                  <div className="relative min-h-full w-full">
                    {!isDescEditorReady && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        {renderDescriptionPreview(false)}
                      </div>
                    )}
                    <div className={`${descriptionPaddingClass} ${descriptionContentClass} ${isDescEditorReady ? 'visible' : 'invisible'}`}>
                      <MarkdownnEditor
                        ref={editorRef}
                        value={descInput}
                        onSave={(val) => { handleSubmitDesc(val); setEditingDesc(false); setIsDirty(false); setIsDescEditorReady(false); }}
                        onCancel={() => { setEditingDesc(false); setDescInput(task?.description || ""); setIsDirty(false); setIsDescEditorReady(false); }}
                        showSaveCancel={false}
                        onDirtyChange={setIsDirty}
                        onReadyChange={setIsDescEditorReady}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {descInput ? (
                <div ref={descViewRef} className={descriptionSurfaceClass} style={descContainerHeight ? { height: descContainerHeight } : undefined}>
                  <div ref={descViewScrollRef} className={descriptionScrollClass}>
                    {renderDescriptionPreview(false)}
                  </div>
                </div>
                ) : (
                  <div
                    className={`${descriptionSurfaceClass} ${descriptionPaddingClass} min-h-[200px] !text-sm rounded cursor-pointer text-muted-foreground italic border border-transparent hover:border-muted-foreground/20 transition-colors flex items-start`}
                    onClick={handleDescClick}
                  >
                    Enter a task description… (Markdown supported!)
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Right column: Fields */}
        <div className="flex flex-col gap-2">
          {/* Assigned User */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <User className={taskDetailIconClass} />
              Assigned to:
            </Label>
            <div className="flex items-center">
              <UserSelector
                options={memberOptions}
                currentValue={task.assignedTo}
                onSelect={handleAssigneeSelect}
              />
            </div>
          </div>
          {/* Due Date */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <Clock className={taskDetailIconClass} />
              Due date:
            </Label>
            <div className="flex items-center">
              <DateSelector
                value={localDueDate}
                onChange={async (newDate) => {
                  setLocalDueDate(newDate);
                  if (taskId && newDate) {
                    await updateTaskById(taskId, { dueDate: newDate });
                  }
                }}
                label={undefined}
                buttonClassName=""
              />
            </div>
          </div>
          {/* Status (Badge Dropdown Trigger) */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <CheckCircle className={taskDetailIconClass} />
              Status:
            </Label>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`border flex items-center px-[10px] py-1 text-sm font-medium cursor-pointer ${statusColors[task.status]}`}
                  >
                    {statusIcons[task.status]}
                    {statusLabels[task.status]}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {allStatuses.map((status: TaskStatus) => (
                    <DropdownMenuRadioItem
                      key={status}
                      value={status}
                      onSelect={async () => {
                        if (taskId) {
                          await updateTaskById(taskId, { status: status as TaskStatus });
                        }
                      }}
                      className="flex items-center cursor-pointer pl-8 relative"
                    >
                      {task.status === status && (
                        <Check className="w-4 h-4 text-primary absolute left-2" />
                      )}
                      <div className="flex items-center gap-2">
                        {statusIcons[status as TaskStatus]}
                        {statusLabels[status as TaskStatus]}
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Created By */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <User className={taskDetailIconClass} />
              Created by:
            </Label>
            {task.createdBy && typeof task.createdBy === 'object' ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="text-base text-primary">
                    {task.createdBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Label className="!mb-0">{task.createdBy.name}</Label>
              </div>
            ) : (
              <Label className="text-muted-foreground">--</Label>
            )}
          </div>
          {/* Created At */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <FolderOpen className={taskDetailIconClass} />
              Created:
            </Label>
            <div className="flex items-center">
              <Label className="!mb-0">
                {task.createdAt
                  ? format(new Date(task.createdAt), "yyyy-MM-dd HH:mm")
                  : "--"}
              </Label>
            </div>
          </div>
          {/* Updated At */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <RefreshCw className={taskDetailIconClass} />
              Updated:
            </Label>
            <div className="flex items-center">
              <Label className="!mb-0">
                {task.updatedAt
                  ? format(new Date(task.updatedAt), "yyyy-MM-dd HH:mm")
                  : "--"}
              </Label>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
      }
      { !task && loadingCurrentTask &&
      <div className="text-muted-foreground">Loading task...</div>
      }
      </>
  );
};

export default TaskDetail;
