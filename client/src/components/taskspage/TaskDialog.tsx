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
import { Calendar as CalendarIcon, Tag, FolderOpen, User, Clock, FileText, PencilLine, History } from "lucide-react";
import { statusLabels, statusIcons } from "@/consts/taskStatusConfig";
import { CheckCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MarkdownnEditor, MarkdownEditorHandle } from "@/components/common/editor/MarkdownEditor";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Calendar } from "@/components/ui-kit/Calendar";
import { DropDownList } from "@/components/common/DropDownList";
import { logger } from "@/utils/logger";
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import LabelSelector from '@/components/common/LabelSelector';

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

const statusOptions = [
  { value: TaskStatus.TODO, label: statusLabels["todo"], icon: statusIcons["todo"] },
  { value: TaskStatus.IN_PROGRESS, label: statusLabels["in-progress"], icon: statusIcons["in-progress"] },
  { value: TaskStatus.DONE, label: statusLabels["done"], icon: statusIcons["done"] },
  { value: TaskStatus.CLOSE, label: statusLabels["close"], icon: statusIcons["close"] },
];

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
          const { id, createdAt, updatedAt, projectName, ...updateData } = taskData;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 !max-w-[1400px] w-[75vw] gap-0"
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
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] w-full min-h-[300px] overflow-auto">
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
            className="flex flex-col gap-6 px-10 py-6"
          >
            <div className="flex flex-col gap-6">
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

              {/* Project and Assigned to */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="flex items-center gap-3 font-medium">
                    <FolderOpen className="size-4" />
                    Project
                  </Label>
                  <DropDownList
                    value={taskState.projectId || "personal"}
                    id="project-select"
                    className="min-w-[12rem] w-full"
                    onValueChange={handleProjectChange}
                    options={[
                      { value: "personal", label: "Non-project (Personal)" },
                      ...projects.map(project => ({ value: project.id, label: project.name }))
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="flex items-center gap-3 font-medium">
                    <User className="size-4" />
                    Assigned to
                  </Label>
                  <DropDownList
                    value={taskState.assignedTo}
                    id="assigned-to"
                    className="min-w-[12rem] w-full"
                    onValueChange={handleAssignedToChange}
                    disabled={!taskState.projectId}
                    options={assignedToSelectOptions}
                    placeholder="Select user"
                  />
                </div>
              </div>
              {/*  Due date and Status */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="flex items-center gap-3 font-medium" htmlFor="due-date">
                    <Clock className="size-4" />
                    Due date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-w-[12rem] text-left justify-between text-secondary-foreground"
                        aria-label="Select due date"
                      >
                        <Label className="ml-1 font-normal">{taskState.dueDate ? new Date(taskState.dueDate).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "Pick a date"}</Label>
                        <CalendarIcon className="size-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={taskState.dueDate ? new Date(taskState.dueDate) : undefined}
                        onSelect={d => {
                          if (d) {
                            dispatch({ type: 'SET_FIELD', field: 'dueDate', value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` });
                          } else {
                            dispatch({ type: 'SET_FIELD', field: 'dueDate', value: null });
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="flex items-center gap-3 font-medium">
                    <CheckCircle className="size-4" />
                    Status
                  </Label>
                  <DropDownList
                    value={taskState.status}
                    onValueChange={v => dispatch({ type: 'SET_FIELD', field: 'status', value: v as TaskStatus })}
                    options={statusOptions}
                    id="status"
                    className="min-w-[12rem] w-full pl-4"
                  />
                </div>
              </div>

              {/* Description row */}
              <div className="flex flex-col gap-2">
                <Label className="mb-1 flex items-center gap-3 font-medium">
                  <FileText className="size-4" />
                  Description
                </Label>
                <div
                  className="markdown-body min-h-[380px] px-3 py-2 overflow-auto !bg-muted/40 dark:!bg-muted/65"
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
          <div className="hidden lg:flex flex-col w-full border-l px-6 py-6">
            {/* Labels selection moved here */}
            <div className="flex flex-col gap-2 mb-6 mt-1">
              <Label className="flex gap-3 font-medium">
                <Tag className="size-4" />
                Labels
              </Label>
              <div className="mt-2">
                <LabelSelector
                  value={taskState.labels}
                  onChange={(next) => dispatch({ type: 'SET_FIELD', field: 'labels', value: next })}
                  projectId={taskState.projectId ? taskState.projectId : null}
                />
              </div>
            </div>
            <Label className="font-medium flex gap-3">
              <History className="size-4" />
              Activity
            </Label>
            <Label className="mt-4">(Coming soon: see task history, comments, etc.)</Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
