import React, { useState, useEffect, useReducer, useRef } from "react";
import { taskFormReducer, initialTaskFormState } from "@/reducers/taskFormReducer";
import { useAuth } from "@/providers/AuthProvider";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { withToast } from "@/utils/toastUtils";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Input } from "@/components/ui-kit/Input";
import { Button } from "@/components/ui-kit/Button";
import { TaskStatus, UserResDto } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";
import { Calendar as CalendarIcon, Tag, FolderOpen, User, Clock, FileText } from "lucide-react";
import { statusLabels, statusIcons } from "@/components/taskspage/taskStatusConfig";
import { CheckCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Calendar } from "@/components/ui-kit/Calendar";
import { DropDownList } from "@/components/common/DropDownList";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (task: { id?: string; title: string; dueDate: string; assignedTo: string; 
    status: TaskStatus; description: string; projectId?: string,
    createdBy: string }) => void;
  initialValues?: {
    id?: string;
    title?: string;
    dueDate?: string;
    assignedTo?: UserResDto; // Only new format (user object)
    status?: TaskStatus;
    description?: string;
    projectId?: string;
    projectName?: string;
  };
  title?: string;
  // Removed projects prop - now using store directly
}

const statusOptions = [
  { value: TaskStatus.TODO, label: statusLabels["todo"], icon: statusIcons["todo"] },
  { value: TaskStatus.IN_PROGRESS, label: statusLabels["in-progress"], icon: statusIcons["in-progress"] },
  { value: TaskStatus.DONE, label: statusLabels["done"], icon: statusIcons["done"] },
  { value: TaskStatus.CLOSE, label: statusLabels["close"], icon: statusIcons["close"] },
];

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open, onOpenChange, onSubmit, initialValues = {}, title = "Add New Task",
}) => {
  const { user } = useAuth();
  const { createTask, updateTaskById } = useTaskStore();
  const { projects } = useProjectStore();
  
  // Convert initialValues to ensure assignedTo is a string
  const processedInitialValues = {
    ...initialValues,
    assignedTo: initialValues.assignedTo?.id || ''
  };
  
  const [taskState, dispatch] = useReducer(
    taskFormReducer, { ...initialTaskFormState, ...processedInitialValues }
  );
  const [assignedToSelectOptions, setAssignedToSelectOptions] = useState<{ value: string; label: string }[]>([]);
  
  const handleAssignedToChange = (value: string) => {
    console.log("Assigned to changed:", value);
    dispatch({ type: 'SET_FIELD', field: 'assignedTo', value });
  };

  const handleSubmit = async (taskData: any) => {
    const isEditMode = !!taskData.id;
    
    await withToast(
      async () => {
        if (isEditMode) {
          // For edit mode, filter out all read-only fields
          const { id, createdAt, updatedAt, projectName, createdBy, ...updateData } = taskData;
          await updateTaskById(id, updateData);
        } else {
          // For create mode, only send the fields that are part of TaskCreateReqDto
          const { id, createdAt, updatedAt, projectName, ...createData } = taskData;
          await createTask(createData);
        }
      },
      {
        success: isEditMode ? 'Task updated successfully!' : 'Task created successfully!',
        error: isEditMode ? 'Failed to update task.' : 'Failed to create task.'
      }
    );
    
    // Call the optional onSubmit callback if provided (for backward compatibility)
    if (onSubmit) {
      onSubmit(taskData);
    }
    
    onOpenChange(false);
  };

  const getAssignedToOptions = (projectId: string | undefined) => {
      const project = projects.find(p => String(p.id) === String(projectId));
      if (!project || !Array.isArray(project.members)) return [];
      return project.members.map((m: any) => ({
        value: String(m.id),
        label: String(m.name || m.id)
      }));  
  };

  useEffect(function populateAssignedTo(){
    if (!taskState.projectId) {
      setAssignedToSelectOptions([{ value: String(user?.id || ""), label: String(user?.name || "Me") }]);
      handleAssignedToChange(String(user?.id || ""));
      return;
    }

    const options = getAssignedToOptions(taskState.projectId);
    setAssignedToSelectOptions(options);

    let assignedUser = "";
    // Get user ID from the UserResDto object
    const initialAssignedTo = initialValues.assignedTo?.id;
    
    if (options.some(opt => opt.value === initialAssignedTo)) {
      assignedUser = initialAssignedTo!;
    } else if (options.length >0){
      assignedUser = options[0].value;
    }
    dispatch({ type: 'SET_FIELD', field: 'assignedTo', value : assignedUser });
    }, [taskState.projectId, projects, user]);

    const handleProjectChange = (value: string) => {
      dispatch({ type: 'SET_FIELD', field: 'projectId', value: value === "personal" ? "" : value });
      // Optionally reset assignedTo here if needed, but useEffect will handle the default
  };

  // Ref for Textarea
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 !max-w-[1200px] w-[75vw] gap-0"
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
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] w-full min-h-[300px]">
          {/* Main form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const taskData: any = {
                ...taskState,
                description: descriptionRef.current?.value || "",
              };
              // Only add createdBy for create mode
              if (!taskState.id) {
                taskData.createdBy = user?.id || "";
              }
              handleSubmit(taskData);
            }}
            className="flex flex-col gap-6 px-10 py-6"
          >
            <div className="flex flex-col gap-6">
              {/* Title row */}
              <div className="flex flex-col gap-2">
                <Label className="mb-1 flex items-center gap-3">
                  <Tag className="size-4" />
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
                  <Label className="flex items-center gap-3">
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
                  <Label className="flex items-center gap-3">
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
                  <Label className="flex items-center gap-3" htmlFor="due-date">
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
                        <span className="ml-1">{taskState.dueDate ? new Date(taskState.dueDate).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "Pick a date"}</span>
                        <CalendarIcon className="size-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={taskState.dueDate ? new Date(taskState.dueDate) : undefined}
                        onSelect={d => d && dispatch({ type: 'SET_FIELD', field: 'dueDate', value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="flex items-center gap-3">
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
                <Label className="mb-1 flex items-center gap-3">
                  <FileText className="size-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="min-h-[200px]"
                  placeholder="Task description"
                  initialValue={taskState.description || ""}
                  ref={descriptionRef}
                  storageKey={taskState.id || "new-task"}
                  rows={5}
                  showButtons={false}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                variant="default"
                disabled={
                  !taskState.title.trim() ||
                  !taskState.assignedTo ||
                  !user?.id
                }
              >
                Save
              </Button>
            </div>
          </form>
          {/* Right panel for future content */}
          <div className="hidden lg:flex flex-col w-full border-l px-6 py-6">
            <div className="text-lg text-muted-foreground font-bold mb-4">Changelog / Activity</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">(Coming soon: see task history, comments, etc.)</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
