import React, { useState, useEffect, useReducer, useRef, useMemo } from "react";
import { taskFormReducer, initialTaskFormState } from "@/reducers/taskFormReducer";
import { useAuth } from "@/providers/AuthProvider";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { withToast } from "@/utils/toastUtils";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Input } from "@/components/ui-kit/Input";
import { Button } from "@/components/ui-kit/Button";
import { TaskStatus, UserResDto } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";
import { Tag, FolderOpen, User, Clock, FileText, PencilLine, History } from "lucide-react";
import { allStatuses, statusColors, statusLabels, statusIcons } from "@/consts/taskStatusConfig";
import { CheckCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MarkdownnEditor, MarkdownEditorHandle } from "@/components/common/editor/MarkdownEditor";
import { DropDownList } from "@/components/common/DropDownList";
import { logger } from "@/utils/logger";
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import LabelSelector from '@/components/common/LabelSelector';
import UserSelector from '@/components/common/UserSelector';
import DateSelector from '@/components/common/DateSelector';
import { Badge } from '@/components/ui-kit/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui-kit/Dropdown-menu';
import { Check } from 'lucide-react';

type LabelLike = { id?: string | null } | string | null | undefined;

function normalizeLabelIds(labels: LabelLike[] | undefined): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .map((label) => (typeof label === 'string' ? label : label?.id))
    .filter((labelId): labelId is string => Boolean(labelId));
}

export function shouldIncludeTaskUpdateLabels(initialLabels: LabelLike[] | undefined, nextLabels: LabelLike[] | undefined): boolean {
  const initialIds = normalizeLabelIds(initialLabels);
  const nextIds = normalizeLabelIds(nextLabels);

  if (initialIds.length !== nextIds.length) {
    return true;
  }

  const initialSet = new Set(initialIds);
  for (const labelId of nextIds) {
    if (!initialSet.has(labelId)) {
      return true;
    }
  }

  return false;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    id?: string;
    title?: string;
    dueDate?: string;
    assignedTo?: UserResDto;
    status?: TaskStatus;
    description?: string;
    projectId?: string;
    projectName?: string;
    labels?: { id: string; labelName: string }[] | string[];
  };
  title?: string;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open, onOpenChange, initialValues = {}, title = "Add New Task",
}) => {
  const { user } = useAuth();
  const { createTask, updateTaskById } = useTaskStore();
  const { projects } = useProjectStore();
  // Ref for Markdown editor imperative handle
  const mdEditorRef = useRef<MarkdownEditorHandle | null>(null);
  // Extract label ids (objects or plain strings) once; avoid extra effects
  const initialLabelIds = useMemo(() => {
    const ls: any[] = (initialValues.labels as any[]) || [];
    return ls.map(l => (typeof l === 'object' && l ? l.id : l)).filter(Boolean);
  }, [initialValues.labels]);

  const seedState = useMemo(() => ({
    ...initialTaskFormState,
    ...initialValues,
    assignedTo: initialValues.assignedTo?.id || '',
    labels: initialLabelIds,
  }), [initialValues, initialLabelIds]);

  const [taskState, dispatch] = useReducer(taskFormReducer, seedState);
  const [assignedToSelectOptions, setAssignedToSelectOptions] = useState<{ value: string; label: string }[]>([]);
  const selectedAssignee = useMemo(() => {
    const selectedOption = assignedToSelectOptions.find((option) => option.value === taskState.assignedTo);
    return selectedOption
      ? { id: taskState.assignedTo, name: selectedOption.label }
      : null;
  }, [assignedToSelectOptions, taskState.assignedTo]);
  
  const handleAssignedToChange = (value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'assignedTo', value });
  };

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Removed effect that re-dispatched labels to prevent unnecessary rerenders

  const handleSubmit = async (taskData: any) => {
    const isEditMode = !!taskData.id;
    let submitSuccess = false;
    await withToast(
      async () => {
        if (isEditMode) {
          const { id, createdAt, updatedAt, projectName, ...rawUpdateData } = taskData;
          const updateData = { ...rawUpdateData };
          if (!shouldIncludeTaskUpdateLabels(initialValues.labels, taskData.labels)) {
            delete updateData.labels;
          }
          await updateTaskById(String(taskData.id), updateData);
        } else {
          // For create mode, only send the fields that are part of TaskCreateReqDto
          const { id, createdAt, updatedAt, projectName, ...createData } = taskData;
          await createTask(createData);
        }
        submitSuccess = true;
      },
      {
        success: isEditMode ? 'Task updated successfully!' : 'Task created successfully!',
        error: isEditMode ? 'Failed to update task.' : 'Failed to create task.'
      }
    );

    // Close dialog on successful submit
    if (submitSuccess) {
      onOpenChange(false);
    }
  };

  const getAssignedToOptions = (projectId: string | undefined) => {
      const project = projects.find(p => String(p.id) === String(projectId));
      if (!project || !Array.isArray(project.members)) return [];
      return project.members.map((m: any) => ({
        value: String(m.id),
        label: String(m.name || m.id)
      }));  
  };

  useEffect(() => {
    if (!taskState.projectId) {
      setAssignedToSelectOptions([{ value: String(user?.id || ""), label: String(user?.name || "Me") }]);
      handleAssignedToChange(String(user?.id || ""));
      return;
    }
    logger.debug("TaskDialog useEffect:", taskState);
    const options = getAssignedToOptions(taskState.projectId);
    setAssignedToSelectOptions(options);

    let assignedUser = "";
    // Get user ID from the UserResDto object
    const initialAssignedTo = initialValues.assignedTo?.id;

    if (options.some(opt => opt.value === initialAssignedTo)) {
      assignedUser = initialAssignedTo!;
    } else if (user?.id && options.some(opt => opt.value === user.id)) {
      assignedUser = user.id;
    } else if (options.length > 0) {
      assignedUser = options[0].value;
    }
    setTimeout(() => {
      dispatch({ type: 'SET_FIELD', field: 'assignedTo', value: assignedUser });
    });
  }, [taskState.projectId, projects, user, initialValues.assignedTo]);

  const handleProjectChange = (value: string) => {
      dispatch({ type: 'SET_FIELD', field: 'projectId', value: value === "personal" ? "" : value });
  };

  const fieldRowClass = "flex items-center gap-2 min-h-[40px]";
  const fieldLabelClass = "font-medium min-w-[120px] flex items-center gap-2 mb-0 text-muted-foreground dark:text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 max-w-300! w-[68vw] gap-0"
        onInteractOutside={e => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle></DialogTitle>.
        </VisuallyHidden>
        {/* Navigation bar */}
        <nav className="flex items-center justify-between h-15 border-b bg-white-black rounded-t-md">
          <span className="flex-1 text-center font-bold text-2xl text-secondary-foreground">
            {title}
          </span>
          <span className="w-8" /> {/* Spacer for symmetry */}
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] w-full min-h-75 overflow-auto">
          {/* Main form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              // Delegate to editor save so paste/upload logic and image handling runs there
              if (mdEditorRef.current && mdEditorRef.current.save) {
                mdEditorRef.current.save();
              } else {
                // Fallback: no editor instance available, submit with current state
                const taskData: any = {
                  ...taskState,
                  description: taskState.description || "",
                };
                if (!taskState.id) taskData.createdBy = user?.id || "";
                handleSubmit(taskData);
              }
            }}
            className="flex flex-col gap-6 px-8 py-6"
          >
            <div className="flex flex-col gap-6 max-w-[48rem]">
              {/* Title row */}
              <div className="flex flex-col gap-2">
                <Label className="mb-1 flex items-center gap-3 font-medium">
                  <PencilLine className="size-4" />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={taskState.title}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
                  required
                />
              </div>

              {/* Description row */}
              <div className="flex flex-col gap-2">
                <Label className="mb-1 flex items-center gap-3 font-medium">
                  <FileText className="size-4" />
                  Description
                </Label>
                <div
                  className="markdown-body min-h-[260px] max-h-[320px] rounded-xl border border-border/60 px-3 py-2 overflow-auto bg-muted/40! dark:bg-muted/65!"
                >
                  <MarkdownnEditor
                    ref={mdEditorRef}
                    value={taskState.description || ""}
                    showSaveCancel={false}
                    onSave={async (md) => {
                      setSaving(true);
                      try {
                        const normalized = (md ?? "") as string;
                        const taskData: any = {
                          ...taskState,
                          description: normalized,
                        };
                        if (!taskState.id) {
                          taskData.createdBy = user?.id || "";
                        }
                        await handleSubmit(taskData);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    onDirtyChange={(d) => setIsDirty(!!d)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex gap-3 font-medium">
                  <History className="size-4" />
                  Activity
                </Label>
                <Label className="text-muted-foreground">(Coming soon: see task history, comments, etc.)</Label>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-6">
              <div />
              <div className="flex items-center gap-3">
                {isDirty && (
                  <div className='mr-1'>
                    <UnsavedChangesIndicator />
                  </div>
                )}
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => mdEditorRef.current?.cancel()} disabled={saving}>Cancel</Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => mdEditorRef.current?.save()}
                  disabled={saving || !taskState.title.trim() || !taskState.assignedTo || !user?.id}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </form>
          {/* Right panel */}
          <div className="flex flex-col w-full border-t lg:border-t-0 lg:border-l px-6 py-6">
            <div className="flex flex-col gap-3 mb-6 mt-1">
              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <Tag className="size-4" />
                  Labels
                </Label>
                <LabelSelector
                  value={taskState.labels}
                  onChange={(next) => {
                    logger.debug('TaskDialog.LabelSelector onChange', { next, taskId: taskState.id });
                    dispatch({ type: 'SET_FIELD', field: 'labels', value: next });
                  }}
                  projectId={taskState.projectId ? taskState.projectId : null}
                  className="min-h-8 items-center gap-2"
                  triggerClassName="h-7 w-7 !px-2"
                />
              </div>
              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <FolderOpen className="size-4" />
                  Project
                </Label>
                <div className="flex items-center">
                  <DropDownList
                    value={taskState.projectId || "personal"}
                    id="project-select"
                    className="min-w-[12rem] h-8.5!"
                    onValueChange={handleProjectChange}
                    options={[
                      { value: "personal", label: "Non-project (Personal)" },
                      ...projects.map(project => ({ value: project.id, label: project.name }))
                    ]}
                  />
                </div>
              </div>

              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <User className="size-4" />
                  Assignee
                </Label>
                <div className="flex items-center">
                  <UserSelector
                    options={assignedToSelectOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    currentValue={selectedAssignee}
                    onSelect={handleAssignedToChange}
                    triggerLabelClassName="font-normal leading-none"
                  />
                </div>
              </div>

              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <Clock className="size-4" />
                  Due date
                </Label>
                <div className="flex items-center">
                  <DateSelector
                    value={taskState.dueDate || undefined}
                    onChange={(newDate) => dispatch({ type: 'SET_FIELD', field: 'dueDate', value: newDate ?? '' })}
                    label={undefined}
                  />
                </div>
              </div>

              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <CheckCircle className="size-4" />
                  Status
                </Label>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`border flex items-center px-[10px] py-1 text-sm font-medium cursor-pointer ${statusColors[taskState.status]}`}
                      >
                        {statusIcons[taskState.status]}
                        {statusLabels[taskState.status]}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {allStatuses.map((status) => (
                        <DropdownMenuRadioItem
                          key={status}
                          value={status}
                          onSelect={() => {
                            dispatch({ type: 'SET_FIELD', field: 'status', value: status });
                          }}
                          className="flex items-center cursor-pointer pl-8 relative"
                        >
                          {taskState.status === status && (
                            <Check className="w-4 h-4 text-primary absolute left-2" />
                          )}
                          <div className="flex items-center gap-2">
                            {statusIcons[status]}
                            {statusLabels[status]}
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
