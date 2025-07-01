import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Button } from "@/components/ui-kit/Button";
import { TaskStatus, ProjectResDto } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";
import { CheckCircle, Square, Loader2, XCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui-kit/Calendar";
import { DropDownList } from "@/components/DropDownList";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: { dueDate: string; assignedTo: string; status: TaskStatus; description: string; projectId?: string }) => void;
  initialValues?: {
    dueDate?: string;
    assignedTo?: string;
    status?: TaskStatus;
    description?: string;
    projectId?: string;
    projectName?: string;
  };
  title?: string;
  projects: ProjectResDto[];
  assignedToOptions?: { id: string; name: string }[];
}

const statusOptions = [
  { value: TaskStatus.TODO, label: "To Do", icon: <Square className="text-yellow-500 ml-2" /> },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress", icon: <Loader2 className="text-blue-500 ml-2 animate-spin-slow" /> },
  { value: TaskStatus.DONE, label: "Done", icon: <CheckCircle className="text-green-500 ml-2" /> },
  { value: TaskStatus.CLOSE, label: "Closed", icon: <XCircle className="text-red-400 ml-2" /> },
];

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues = {},
  title = "Add New Task",
  projects,
  assignedToOptions,
}) => {
  const [taskDueDate, setTaskDueDate] = useState(initialValues.dueDate || "");
  // Set default for taskAssignedTo to 'me' if no assignedToOptions and not already set
  const [taskAssignedTo, setTaskAssignedTo] = useState(
    initialValues.assignedTo || (!!assignedToOptions?.length ? "" : "me")
  );
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(initialValues.status || TaskStatus.TODO);
  const [taskDescription, setTaskDescription] = useState(initialValues.description || "");
  const [taskProjectId, setTaskProjectId] = useState(initialValues.projectId || "");

  // Use the task title if present, otherwise fallback to dialog title
  const dialogTitle = initialValues.assignedTo ? `Task for ${initialValues.assignedTo}` : title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 !max-w-[60vw] gap-0">
        <VisuallyHidden>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </VisuallyHidden>
        {/* Navigation bar */}
        <nav className="flex items-center justify-between h-15 border-b bg-white dark:bg-muted rounded-t-md">
          <span className="flex-1 text-center font-bold text-2xl text-secondary-foreground">
            {initialValues.description ? initialValues.description.slice(0, 32) + (initialValues.description.length > 32 ? '…' : '') : dialogTitle}
          </span>
          <span className="w-8" /> {/* Spacer for symmetry */}
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full min-h-[400px]">
          {/* Main form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              onSubmit({
                dueDate: taskDueDate,
                assignedTo: taskAssignedTo,
                status: taskStatus,
                description: taskDescription,
                projectId: taskProjectId || undefined
              });
              onOpenChange(false);
            }}
            className="flex flex-col gap-6 px-10 py-6"
          >
            <div className="flex flex-col gap-6">
              {/* First row: Project and Assigned to */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base">Project</Label>
                  <DropDownList
                    value={taskProjectId || "personal"} id="project-select" className="min-w-[12rem] w-full"
                    onValueChange={value => {
                      setTaskProjectId(value === "personal" ? "" : value);
                    }}
                    options={[
                      { value: "personal", label: "No project (Personal)" },
                      ...projects.map(project => ({ value: project.id, label: project.name }))
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base">Assigned to</Label>
                  <DropDownList
                    value={taskAssignedTo || "me"}
                    id="assigned-to"
                    className="min-w-[12rem] w-full"
                    onValueChange={setTaskAssignedTo}
                    disabled={!Array.isArray(assignedToOptions) || assignedToOptions.length === 0}
                    options={
                      Array.isArray(assignedToOptions) && assignedToOptions.length > 0
                        ? assignedToOptions.map(user => ({ value: user.id, label: user.name }))
                        : [{ value: "me", label: "Me" }]
                    }
                    placeholder="Select user"
                  />
                </div>
              </div>
              {/* Second row: Due date and Status */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-base" htmlFor="due-date">Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-w-[12rem] text-left justify-between"
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
                <Label className="text-base mb-1" htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className="bg-slate-50 dark:bg-slate-900 px-3 py-2 min-h-[150px] focus:ring-2 focus:ring-primary/30"
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
          <div className="hidden lg:flex flex-col w-full border-l bg-slate-50 dark:bg-slate-900 px-6 py-6">
            <div className="text-lg text-muted-foreground font-bold mb-4">Changelog / Activity</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">(Coming soon: see task history, comments, etc.)</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
