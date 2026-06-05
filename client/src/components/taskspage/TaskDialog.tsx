import React, { useState, useEffect, useReducer, useRef, useMemo } from "react";
import { format } from "date-fns";
import { taskFormReducer, initialTaskFormState } from "@/reducers/taskFormReducer";
import { useAuth } from "@/providers/AuthProvider";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useLabelStore } from "@/stores/useLabelStore";
import { withToast } from "@/utils/toastUtils";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Input } from "@/components/ui-kit/Input";
import { Button } from "@/components/ui-kit/Button";
import { TaskStatus, UserResDto } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";
import { Tag, FolderOpen, User, Clock, FileText, PencilLine, RefreshCw } from "lucide-react";
import { allStatuses, statusColors, statusLabels, statusIcons } from "@/consts/taskStatusConfig";
import { CheckCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MarkdownnEditor, MarkdownEditorHandle } from "@/components/common/editor/MarkdownEditor";
import { DropDownList } from "@/components/common/DropDownList";
import TaskCommentsSection from '@/components/taskspage/TaskCommentsSection';
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

function normalizeTaskDescription(value: string | undefined): string {
  return (value ?? '').trim();
}

export function shouldShowTaskDialogDescriptionUnsavedIndicator({
  initialDescription,
  currentDescription,
}: {
  initialDescription?: string;
  currentDescription: string;
}): boolean {
  return normalizeTaskDescription(initialDescription) !== normalizeTaskDescription(currentDescription);
}

interface TaskDialogLabelFilter {
  selectedLabelId?: string | null;
  selectedLabelIds?: string[] | null;
  selectedLabelSetId?: string | null;
  selectedLabelSetLabelIds?: string[] | null;
  selectedLabelSetLabelIdsBySet?: Record<string, string[]> | null;
}

function areTaskLabelIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  return right.every((labelId) => leftSet.has(labelId));
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    id?: string;
    title?: string;
    dueDate?: string;
    createdAt?: string;
    updatedAt?: string;
    assignedTo?: UserResDto;
    status?: TaskStatus;
    description?: string;
    projectId?: string;
    projectName?: string;
    labels?: { id: string; labelName: string }[] | string[];
  };
  title?: string;
  personalTaskMode?: boolean;
  labelFilter?: TaskDialogLabelFilter;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open, onOpenChange, initialValues = {}, title = "Add New Task", personalTaskMode = false, labelFilter,
}) => {
  const { user } = useAuth();
  const { createTask, updateTaskById } = useTaskStore();
  const { projects } = useProjectStore();
  const { fetchLabels, fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();
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
  const initialDescription = useMemo(() => initialValues.description || '', [initialValues.description]);

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
  const [descriptionDraft, setDescriptionDraft] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [labelValidationError, setLabelValidationError] = useState<string | null>(null);
  // Removed effect that re-dispatched labels to prevent unnecessary rerenders

  useEffect(() => {
    setDescriptionDraft(initialDescription);
  }, [initialDescription]);

  const showDescriptionUnsavedIndicator = shouldShowTaskDialogDescriptionUnsavedIndicator({
    initialDescription,
    currentDescription: descriptionDraft,
  });

  const handleSubmit = async (taskData: any) => {
    if (!taskData.id && isCreateLabelRequired && (!Array.isArray(taskData.labels) || taskData.labels.length === 0)) {
      setLabelValidationError('Please select at least one label.');
      return;
    }

    setLabelValidationError(null);

    if (
      !taskData.title?.trim()
      || !taskData.assignedTo
      || !user?.id
    ) {
      return;
    }

    const isEditMode = !!taskData.id;
    let submitSuccess = false;
    await withToast(
      async () => {
        if (isEditMode) {
          const { id, createdAt, updatedAt, projectName, ...rawUpdateData } = taskData;
          const updateData = { ...rawUpdateData };
          if (personalTaskMode) {
            delete updateData.assignedTo;
            delete updateData.projectId;
          }
          if (!shouldIncludeTaskUpdateLabels(initialValues.labels, taskData.labels)) {
            delete updateData.labels;
          }
          await updateTaskById(String(taskData.id), updateData);
        } else {
          // For create mode, only send the fields that are part of TaskCreateReqDto
          const { id, createdAt, updatedAt, projectName, ...createData } = taskData;
          if (personalTaskMode) {
            createData.assignedTo = user?.id || "";
            createData.projectId = "";
          }
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
  const isEditMode = Boolean(initialValues.id);
  const normalizedProjectId = taskState.projectId && taskState.projectId.trim() ? taskState.projectId : null;
  const scopedLabelSets = useMemo(
    () => getLabelSetsForProjectId(normalizedProjectId),
    [getLabelSetsForProjectId, normalizedProjectId]
  );
  const hasCreateLabelFilter = !isEditMode && Boolean(
    labelFilter?.selectedLabelId
      || labelFilter?.selectedLabelIds?.length
      || labelFilter?.selectedLabelSetId
      || Object.values(labelFilter?.selectedLabelSetLabelIdsBySet ?? {}).some((labelIds) => labelIds.length > 0)
  );
  const allowedCreateLabelIds = useMemo(() => {
    if (!hasCreateLabelFilter) {
      return null;
    }

    const nextLabelIds = new Set<string>();

    if (labelFilter?.selectedLabelId) {
      nextLabelIds.add(labelFilter.selectedLabelId);
    }

    for (const labelId of labelFilter?.selectedLabelIds ?? []) {
      nextLabelIds.add(labelId);
    }

    if (labelFilter?.selectedLabelSetId) {
      const selectedLabelSet = scopedLabelSets.find((labelSet) => labelSet.id === labelFilter.selectedLabelSetId);
      const labelIds = labelFilter.selectedLabelSetLabelIds?.length
        ? labelFilter.selectedLabelSetLabelIds
        : selectedLabelSet?.labels.map((label) => label.id) ?? [];

      for (const labelId of labelIds) {
        nextLabelIds.add(labelId);
      }
    }

    for (const labelIds of Object.values(labelFilter?.selectedLabelSetLabelIdsBySet ?? {})) {
      for (const labelId of labelIds) {
        nextLabelIds.add(labelId);
      }
    }

    return Array.from(nextLabelIds);
  }, [hasCreateLabelFilter, labelFilter, scopedLabelSets]);
  const isCreateLabelRequired = hasCreateLabelFilter;

  useEffect(() => {
    if (!open) {
      return;
    }

    fetchLabels(normalizedProjectId ?? undefined, { setActiveScope: false });
    fetchLabelSets(normalizedProjectId ?? undefined, { setActiveScope: false });
  }, [fetchLabelSets, fetchLabels, normalizedProjectId, open]);

  useEffect(() => {
    if (isEditMode || !hasCreateLabelFilter || !allowedCreateLabelIds) {
      return;
    }

    const nextLabels = allowedCreateLabelIds.length === 1
      ? [allowedCreateLabelIds[0]]
      : taskState.labels.filter((labelId) => allowedCreateLabelIds.includes(labelId));

    if (!areTaskLabelIdsEqual(taskState.labels, nextLabels)) {
      dispatch({ type: 'SET_FIELD', field: 'labels', value: nextLabels });
    }
  }, [allowedCreateLabelIds, hasCreateLabelFilter, isEditMode, taskState.labels]);

  useEffect(() => {
    if (!labelValidationError) {
      return;
    }

    if (!isCreateLabelRequired || taskState.labels.length > 0) {
      setLabelValidationError(null);
    }
  }, [isCreateLabelRequired, labelValidationError, taskState.labels]);

  const isSaveDisabled = saving
    || !taskState.title.trim()
    || !taskState.assignedTo
    || !user?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="h-[min(88vh,56rem)] max-w-300! w-[68vw] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        onInteractOutside={e => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle></DialogTitle>.
        </VisuallyHidden>
        {/* Navigation bar */}
        <nav className="flex items-center justify-between h-15 border-b bg-white-black rounded-t-md">
          <span className="flex-1 text-center font-bold text-xl text-secondary-foreground">
            {title}
          </span>
          <span className="w-8" /> {/* Spacer for symmetry */}
        </nav>
        <div className="grid h-full min-h-0 w-full grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
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
                <div className="mb-1 flex min-h-7 items-center gap-1.5">
                  <Label className="flex items-center gap-3 font-medium">
                    <FileText className="size-4" />
                    Description
                  </Label>
                  <div className={showDescriptionUnsavedIndicator ? '' : 'pointer-events-none opacity-0'}>
                    <UnsavedChangesIndicator />
                  </div>
                </div>
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
                    onValueChange={setDescriptionDraft}
                  />
                </div>
              </div>

              {taskState.id ? <TaskCommentsSection taskId={String(taskState.id)} /> : null}
            </div>
          </form>
          {/* Right panel */}
          <div className="flex flex-col w-full border-t lg:border-t-0 lg:border-l px-6 py-6">
            <div className="flex flex-col gap-3 mb-6 mt-1">
              <div className={fieldRowClass}>
                <Label className={fieldLabelClass}>
                  <Tag className="size-4" />
                  Labels
                  {isCreateLabelRequired && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex flex-col gap-1">
                  <LabelSelector
                    value={taskState.labels}
                    onChange={(next) => {
                      logger.debug('TaskDialog.LabelSelector onChange', { next, taskId: taskState.id });
                      dispatch({ type: 'SET_FIELD', field: 'labels', value: next });
                    }}
                    projectId={taskState.projectId ? taskState.projectId : null}
                    allowedLabelIds={isEditMode ? null : allowedCreateLabelIds}
                    deferCommit={false}
                    className="min-h-8 items-center gap-2"
                    triggerClassName="h-7 w-7 !px-0 !gap-0"
                    emptyText=""
                  />
                  {labelValidationError && (
                    <span className="text-xs text-red-500">{labelValidationError}</span>
                  )}
                </div>
              </div>
              {!personalTaskMode && (
                <>
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
                </>
              )}

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

              {isEditMode && (
                <>
                  <div className={fieldRowClass}>
                    <Label className={fieldLabelClass}>
                      <Clock className="size-4" />
                      Created
                    </Label>
                    <div className="flex items-center">
                      <Label className="!mb-0">
                        {initialValues.createdAt
                          ? format(new Date(initialValues.createdAt), "yyyy-MM-dd HH:mm")
                          : "--"}
                      </Label>
                    </div>
                  </div>

                  <div className={fieldRowClass}>
                    <Label className={fieldLabelClass}>
                      <RefreshCw className="size-4" />
                      Updated
                    </Label>
                    <div className="flex items-center">
                      <Label className="!mb-0">
                        {initialValues.updatedAt
                          ? format(new Date(initialValues.updatedAt), "yyyy-MM-dd HH:mm")
                          : "--"}
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t bg-background px-8 py-4">
          <div />
          <div className="flex items-center gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => mdEditorRef.current?.cancel()} disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="default"
              onClick={() => mdEditorRef.current?.save()}
              disabled={isSaveDisabled}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
