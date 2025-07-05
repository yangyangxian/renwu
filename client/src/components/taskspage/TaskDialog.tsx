import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Input } from "@/components/ui-kit/Input";
import { Button } from "@/components/ui-kit/Button";
import { TaskStatus, ProjectResDto } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";
import { CheckCircle, Square, Loader2, XCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui-kit/Calendar";
import { DropDownList } from "@/components/DropDownList";

interface ProjectMember {
  id: string;
  name?: string;
  projectId?: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: { id?: string; title: string; dueDate: string; assignedTo: string; 
    status: TaskStatus; description: string; projectId?: string,
    createdBy: string }) => void;
  initialValues?: {
    id?: string;
    title?: string;
    dueDate?: string;
    assignedTo?: string;
    status?: TaskStatus;
    description?: string;
    projectId?: string;
    projectName?: string;
  };
  title?: string;
  projects: ProjectResDto[];
  projectMembers?: ProjectMember[];
}

const statusOptions = [
  { value: TaskStatus.TODO, label: "To Do", icon: <Square className="text-yellow-500 ml-2" /> },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress", icon: <Loader2 className="text-blue-500 ml-2 animate-spin-slow" /> },
  { value: TaskStatus.DONE, label: "Done", icon: <CheckCircle className="text-green-500 ml-2" /> },
  { value: TaskStatus.CLOSE, label: "Closed", icon: <XCircle className="text-red-400 ml-2" /> },
];

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open, onOpenChange, onSubmit, initialValues = {}, title = "Add New Task", projects,
  projectMembers = [],
}) => {
  console.log("initialValues" + JSON.stringify(initialValues));
  const [taskId] = useState(initialValues.id || "");
  const [taskTitle, setTaskTitle] = useState(initialValues.title || "");
  const [taskDueDate, setTaskDueDate] = useState(initialValues.dueDate || "");
  const [taskAssignedTo, setTaskAssignedTo] = useState(initialValues.assignedTo || "");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(initialValues.status || TaskStatus.TODO);
  const [taskDescription, setTaskDescription] = useState(initialValues.description || "");
  const [taskProjectId, setTaskProjectId] = useState(initialValues.projectId || "");

  const [assignedToSelectOptions, setAssignedToSelectOptions] = useState<{ value: string; label: string }[]>([]);

  const { user } = useAuth();

  // Populate assigned-to options and ensure value is valid whenever project changes
  useEffect(() => {
    let options: { value: string; label: string }[] = [];
    if (!taskProjectId) {
      // No project selected: only current user is available
      if (user && user.id) {
        options = [{ value: String(user.id), label: String(user.name || user.email || user.id) }];
      }
    } else {
      // Project selected: show all project members
      options = projectMembers
        .filter(opt => opt.projectId === String(taskProjectId))
        .map(opt => ({
          value: String(opt.id),
          label: String(opt.name || opt.id)
        }));
    }
    setAssignedToSelectOptions(options);
    // Ensure assignedTo value is always valid after options change
    if (options.length === 0) {
      setTaskAssignedTo("");
    } else if (!options.some(opt => opt.value === taskAssignedTo)) {
      setTaskAssignedTo(options[0].value);
    }
  }, [taskProjectId, projectMembers, user]);

  const handleProjectChange = (value: string) => {
    setTaskProjectId(value === "personal" ? "" : value);
    // Optionally reset assignedTo here if needed, but useEffect will handle the default
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 !max-w-[60vw] gap-0">
        <VisuallyHidden>
          <DialogTitle></DialogTitle>. 
        </VisuallyHidden>
        {/* Navigation bar */}
        <nav className="flex items-center justify-between h-15 border-b bg-white dark:bg-muted rounded-t-md">
          <span className="flex-1 text-center font-bold text-2xl text-secondary-foreground">
            {title}
          </span>
          <span className="w-8" /> {/* Spacer for symmetry */}
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full min-h-[400px]">
          {/* Main form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              onSubmit({
                id: taskId,
                dueDate: taskDueDate,
                assignedTo: taskAssignedTo,
                status: taskStatus,
                description: taskDescription,
                projectId: taskProjectId || undefined,
                createdBy: user?.id || "",
                title: taskTitle
              });
              onOpenChange(false);
            }}
            className="flex flex-col gap-6 px-10 py-6"
          >
            <div className="flex flex-col gap-6">
              {/* Title row */}
              <div className="flex flex-col gap-2">
                <Label className="text-base mb-1">Title</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              {/* Project and Assigned to */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base">Project</Label>
                  <DropDownList
                    value={taskProjectId || "personal"}
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
                  <Label className="text-base">Assigned to</Label>
                  <DropDownList
                    value={taskAssignedTo}
                    id="assigned-to"
                    className="min-w-[12rem] w-full"
                    onValueChange={setTaskAssignedTo}
                    disabled={!taskProjectId}
                    options={assignedToSelectOptions}
                    placeholder="Select user"
                  />
                </div>
              </div>
              {/*  Due date and Status */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base" htmlFor="due-date">Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-w-[12rem] text-left justify-between text-secondary-foreground"
                        aria-label="Select due date"
                      >
                        <span>{taskDueDate ? new Date(taskDueDate).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "Pick a date"}</span>
                        <CalendarIcon className="size-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={taskDueDate ? new Date(taskDueDate) : undefined}
                        onSelect={d => d && setTaskDueDate(d.toISOString().slice(0, 10))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base">Status</Label>
                  <DropDownList
                    value={taskStatus}
                    onValueChange={v => setTaskStatus(v as TaskStatus)}
                    options={statusOptions}
                    id="status"
                    className="min-w-[12rem] w-full"
                  />
                </div>
              </div>

              {/* Description row */}
              <div className="flex flex-col gap-2">
                <Label className="text-base mb-1" >Description</Label>
                <Textarea
                  id="description"
                  className="bg-muted px-3 py-2 min-h-[150px] focus:ring-2 focus:ring-primary/30"
                  placeholder="Task description (Markdown supported in future)"
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="default">Save</Button>
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
