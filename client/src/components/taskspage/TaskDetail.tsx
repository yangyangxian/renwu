import React, { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { TaskStatus } from "@fullstack/common";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioItem } from "@/components/ui-kit/Dropdown-menu";
import { Badge } from "@/components/ui-kit/Badge";
import { Label } from "@/components/ui-kit/Label";
import { MarkdownnEditor, MarkdownEditorHandle } from '@/components/common/editor/MarkdownEditor';
import { Button } from '@/components/ui-kit/Button';
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import { Tag, FolderOpen, User, Clock, FileText, CheckCircle, Check, RefreshCw, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import DateSelector from "@/components/common/DateSelector";
import { useTaskStore } from "@/stores/useTaskStore";
import { statusLabels, statusColors, statusIcons, allStatuses } from "@/consts/taskStatusConfig";
import { marked } from 'marked';
import { toast } from 'sonner';
import { Skeleton } from "../ui-kit/Skeleton";
import { motion } from "framer-motion";

interface TaskDetailProps {
  taskId: string;
}

const fieldLabelContainerClass = "flex items-center gap-3 h-7";
const fieldLabelClass = "font-medium min-w-[120px] flex items-center gap-2 mb-3";

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { currentTask, updateTaskById, fetchCurrentTask, loading: loadingCurrentTask } = useTaskStore();
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(currentTask?.dueDate);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    fetchCurrentTask(taskId);
  }, [taskId, fetchCurrentTask]);

  useEffect(() => {
    setLocalDueDate(currentTask?.dueDate);
    if (currentTask) {
      setDescInput(currentTask.description || "");
    }
    setEditingDesc(false);
  }, [currentTask?.dueDate, currentTask]);

  const handleDescClick = () => {
    setEditingDesc(true);
  };

  const handleSubmitDesc = async (newValue: string) => {
    setEditingDesc(false);
    setDescInput(newValue);
    if (!currentTask) return;
    try {
      await updateTaskById(taskId, { description: newValue });
      toast.success('Task description updated');
    } catch {
      toast.error('Failed to update description');
      setDescInput(currentTask.description || "");
    }
  };

  const renderedHtml: string = useMemo(() => {
    const out = marked.parse(descInput) as unknown;
    return typeof out === 'string' ? out : '';
  }, [descInput]);

  const task = currentTask!;
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
        <Label className="text-xl font-bold flex items-center gap-3">
          <Tag className="size-5" />
          {task.title}
        </Label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,11fr)_minmax(280px,5fr)] gap-6 px-3 w-full">
        {/* Left column: Description and future comments */}
        <div className="flex flex-col gap-4">
          {/* Description */}
          <div className="flex flex-col gap-3 min-h-[48px]">
            <Label className={fieldLabelClass}>
              <FileText className="size-4" />
              Description:
            </Label>
            {editingDesc ? (
              <div className="h-[600px] !text-sm rounded-lg flex flex-col">
                <div className="flex-1 overflow-y-auto px-3 py-2 !bg-muted/40 dark:!bg-muted/65">
                  <MarkdownnEditor
                    ref={editorRef}
                    value={descInput}
                    onSave={(val) => { handleSubmitDesc(val); setEditingDesc(false); setIsDirty(false); }}
                    onCancel={() => { setEditingDesc(false); setDescInput(currentTask?.description || ""); setIsDirty(false); }}
                    showSaveCancel={false}
                    onDirtyChange={setIsDirty}
                  />
                </div>
                <div className="flex justify-end items-center gap-2 my-2 mt-4 mr-3">
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
              </div>
            ) : (
              <>
                {descInput ? (
                <div className='markdown-body overflow-auto min-h-[200px] max-h-[600px] !bg-muted/40 dark:!bg-muted/65 flex w-full h-full relative'>
                  <div
                    className="px-3 py-2 w-full"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-3 top-2 opacity-70 group-hover:opacity-100 transition-opacity"
                    onClick={handleDescClick}
                    title="Edit description"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
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
        <div className="flex flex-col gap-5">
          {/* Assigned User */}
          {task.assignedTo && (
            <div className={fieldLabelContainerClass}>
              <Label className={fieldLabelClass}>
                <User className="size-4" />
                Assigned to:
              </Label>
              <Avatar className="size-6">
                <AvatarFallback className="text-base text-primary">
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Label>{task.assignedTo.name}</Label>
            </div>
          )}
          {/* Due Date */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <Clock className="size-4" />
              Due date:
            </Label>
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
          {/* Status (Badge Dropdown Trigger) */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <CheckCircle className="size-4" />
              Status:
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="outline"
                  className={`border flex items-center px-1.5 py-1 text-xs font-medium cursor-pointer ${statusColors[task.status]}`}
                >
                  {statusIcons[task.status]}
                  {statusLabels[task.status]}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
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
          {/* Created By */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <User className="size-4" />
              Created by:
            </Label>
            {task.createdBy && typeof task.createdBy === 'object' ? (
              <>
                <Avatar className="size-6">
                  <AvatarFallback className="text-base text-primary">
                    {task.createdBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Label>{task.createdBy.name}</Label>
              </>
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
            <Label>
              {task.createdAt
                ? format(new Date(task.createdAt), "yyyy-MM-dd HH:mm")
                : "--"}
            </Label>
          </div>
          {/* Updated At */}
          <div className={fieldLabelContainerClass}>
            <Label className={fieldLabelClass}>
              <RefreshCw className="size-4" />
              Updated:
            </Label>
            <Label>
              {task.updatedAt
                ? format(new Date(task.updatedAt), "yyyy-MM-dd HH:mm")
                : "--"}
            </Label>
          </div>
        </div>
      </div>
      </motion.div>
      }
      </>
  );
};

export default TaskDetail;
