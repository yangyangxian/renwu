import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { TaskStatus } from "@fullstack/common";
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

interface TaskDetailProps {
  taskId: string;
}

const fieldLabelContainerClass = "flex items-center gap-3 min-h-[44px]";
const fieldLabelClass = "font-medium min-w-[120px] flex items-center gap-2 mb-0 text-muted-foreground dark:text-white";

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { currentTask, updateTaskById, fetchCurrentTask, loading: loadingCurrentTask } = useTaskStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState<string>(currentTask?.title || "");
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(currentTask?.dueDate);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descViewRef = useRef<HTMLDivElement | null>(null);
  const [descContainerHeight, setDescContainerHeight] = useState<number | undefined>(undefined);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const task = currentTask!;
  const { projects } = useProjectStore();

  useEffect(() => {
    if (!taskId) return;
    fetchCurrentTask(taskId);
  }, [taskId, fetchCurrentTask]);

  useEffect(() => {
    setLocalDueDate(currentTask?.dueDate);
    if (currentTask) {
      setDescInput(currentTask.description || "");
      setTitleInput(currentTask.title || "");
    }
    setEditingDesc(false);
  }, [currentTask?.dueDate, currentTask]);

  const saveTitle = async (value: string) => {
    if (!currentTask) return;
    const newTitle = value.trim();
    if (newTitle === currentTask.title) return;
    try {
      await updateTaskById(taskId, { title: newTitle });
      toast.success('Task title updated');
    } catch (err) {
      toast.error('Failed to update title');
      setTitleInput(currentTask.title || "");
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
      setTitleInput(currentTask?.title || "");
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
    setEditingDesc(true);
  };

  const handleSubmitDesc = async (newValue: string) => {
    setEditingDesc(false);
    setDescInput(newValue);
    if (!currentTask) return;
    try {
      await updateTaskById(taskId, { description: newValue });
      toast.success('Task description updated');
      setDescContainerHeight(undefined);
    } catch {
      toast.error('Failed to update description');
      setDescInput(currentTask.description || "");
      setDescContainerHeight(undefined);
    }
  };

  const renderedHtml: string = useMemo(() => {
    const out = marked.parse(descInput) as unknown;
    return typeof out === 'string' ? out : '';
  }, [descInput]);

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
      { !loadingCurrentTask && task &&
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
      >
      {/* Title block above columns */}
      <div className="mb-8">
        {/* restore larger title font and ensure the leading icon is visible in dark mode */}
        <div className="text-2xl font-bold flex items-center gap-3">
          <Tag className="size-5 text-muted-foreground dark:text-white" />
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
                <Label htmlFor={`task-title-input-${taskId}`} className="max-w-[900px] min-w-0 truncate mb-0 text-2xl dark:text-white">
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
                  className="opacity-70 hover:opacity-100 transition-opacity text-muted-foreground dark:text-white"
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
          {/* Description */}
          <div className="flex flex-col gap-3 min-h-[48px]">
            <div className="flex items-center justify-between">
              <Label className={fieldLabelClass}>
                <FileText className="size-4" />
                Description:
              </Label>
              <div className="ml-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-80 hover:opacity-100 transition-opacity text-muted-foreground dark:text-white"
                  onClick={handleDescClick}
                  title="Edit description"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {editingDesc ? (
              <>
                <div
                  className='markdown-body overflow-auto min-h-[200px] max-h-[600px] !bg-muted/40 dark:!bg-muted/65 flex w-full h-full'
                  style={descContainerHeight ? { height: descContainerHeight } : undefined}
                >
                  <div className="px-3 py-2 w-full">
                    <MarkdownnEditor
                      ref={editorRef}
                      value={descInput}
                      onSave={(val) => { handleSubmitDesc(val); setEditingDesc(false); setIsDirty(false); }}
                      onCancel={() => { setEditingDesc(false); setDescInput(currentTask?.description || ""); setIsDirty(false); setDescContainerHeight(undefined); }}
                      showSaveCancel={false}
                      onDirtyChange={setIsDirty}
                    />
                  </div>
                </div>
                <div className="flex justify-end items-center gap-2 my-2 mt-2 mr-3">
                  {isDirty && (
                    <div className='mr-3'>
                      <UnsavedChangesIndicator />
                    </div>
                  )}
                  <Button size="sm" variant="default" disabled={!isDirty} onClick={() => editorRef.current?.save()}>
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => editorRef.current?.cancel()}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                {descInput ? (
                <div ref={descViewRef} className="markdown-body w-full !bg-muted/40 dark:!bg-muted/65">
                  <div className="overflow-auto min-h-[200px] max-h-[600px] px-3 py-2">
                    <div className="w-full" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                  </div>
                </div>
                ) : (
                  <div
                    className="markdown-body min-h-[200px] !text-sm !bg-muted/40 dark:!bg-muted/65 !p-3 rounded cursor-pointer text-muted-foreground italic border border-transparent hover:border-muted-foreground/20 transition-colors flex items-start"
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
              <User className="size-4" />
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
              <Clock className="size-4" />
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
              <CheckCircle className="size-4" />
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
              <User className="size-4" />
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
              <FolderOpen className="size-4" />
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
              <RefreshCw className="size-4" />
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
      </>
  );
};

export default TaskDetail;
