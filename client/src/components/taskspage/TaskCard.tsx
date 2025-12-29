import React, { useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui-kit/Button";
import { Trash2, AlertCircle, ChevronRight, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui-kit/Tooltip";
import { formatDateSmart } from "@/utils/dateUtils";
import { TaskStatus, UserResDto } from "@fullstack/common";
import { useTaskStore } from "@/stores/useTaskStore";
import { withToast } from "@/utils/toastUtils";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import LabelBadge from "@/components/common/LabelBadge";

interface TaskCardProps {
  taskId: string; // Add taskId prop for deletion
  title: string;
  description: string;
  dueDate?: string;
  projectName?: string;
  assignedTo?: UserResDto;
  labels?: Array<{ id: string; labelName?: string; name?: string; color?: string; labelColor?: string }>;
  status?: TaskStatus;
  onClick?: () => void;
  className?: string;
  showDeleteButton?: boolean; 
}

const statusToColor: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "text-amber-400 dark:text-amber-500",
  [TaskStatus.IN_PROGRESS]: "text-blue-500 dark:text-blue-400",
  [TaskStatus.DONE]: "text-green-500 dark:text-green-600",
  [TaskStatus.CLOSE]: "text-gray-500",
};

const TaskCard: React.FC<TaskCardProps> = ({ taskId, title, dueDate, projectName, assignedTo, 
  status, onClick, description, className, showDeleteButton, labels }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deleteTaskById } = useTaskStore();
  const labelsRightClass = showDeleteButton ? 'right-3 group-hover:right-10 group-focus-within:right-10' : 'right-3';

  const handleDeleteTask = async () => {
    await withToast(
      async () => {
        await deleteTaskById(taskId);
      },
      {
        success: 'Task deleted successfully!',
        error: 'Failed to delete task.'
      }
    );
  };
  
  // Show overdue icon only for TODO and IN_PROGRESS
  const isOverdue = dueDate
    ? (new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) &&
      (status === TaskStatus.TODO || status === TaskStatus.IN_PROGRESS)
    : false;
  return (
    <Card
      className={`group dark:bg-gray-950 p-3 card-border hover:scale-102 transition-transform duration-200 cursor-pointer relative min-w-0 ${className || ''}`}
      tabIndex={0}
      aria-label={title}
      onClick={onClick}
    >
      {!!labels?.length && (
        <div className={`absolute top-3 ${labelsRightClass} flex flex-wrap gap-1 justify-end max-w-[70%] pointer-events-none transition-[right] duration-200`}>
          {labels
            .filter(l => l && (l.labelName || l.name))
            .map(l => (
              <LabelBadge
                key={l.id}
                text={(l.labelName || l.name) as string}
                color={l.color ?? l.labelColor}
                className="px-1.5 py-[2px] text-[10px]"
              />
            ))}
        </div>
      )}
      {/* Delete icon, only visible on hover or focus */}
      {showDeleteButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-3 bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-500 
          transition-opacity duration-150 p-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
          focus:opacity-100 focus-visible:opacity-100 pointer-events-none group-hover:pointer-events-auto 
          group-focus-within:pointer-events-auto focus:pointer-events-auto focus-visible:pointer-events-auto 
          dark:bg-black/60 dark:hover:bg-red-900"
          style={{ width: 24, height: 24, minWidth: 0 }}
          tabIndex={0}
          aria-label="Delete task"
          type="button"
          onClick={e => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
      <ConfirmDeleteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Delete Task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={(e?: React.MouseEvent) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          setDialogOpen(false);
          handleDeleteTask();
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <div className="flex items-center w-3/4 mb-2">
          <div className={`text-xs lg:text-[13px] font-medium font-sans ${status ? statusToColor[status] : 'text-blue-500'}`}>
            {!projectName || projectName === "" ? "Personal" : projectName}
          </div>
          {/* Assigned to user info - moved next to project name */}
          {assignedTo && (
            <div className="flex items-center gap-1 ml-3">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{assignedTo.name}</span>
            </div>
          )}
      </div>
      
      <div className="flex items-center justify-between">
          <div className="flex items-center mr-2 max-w-full">
            <h3 className="text-xs lg:text-[13px] line-clamp-3 break-all overflow-hidden">{title}</h3>
          </div>
        <div className="flex flex-col items-end gap-1">
          {description && description.trim() !== "" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ChevronRight className="w-3 h-3 flex-shrink-0 text-muted-foreground" aria-label="Has description" />
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                See description
              </TooltipContent>
            </Tooltip>
          )}
          {dueDate && (
            <span className="text-xs lg:text-[13px] text-muted-foreground whitespace-nowrap bg-transparent px-1 py-0.5 rounded font-sans flex items-center gap-1">
              {isOverdue && (
                <span title="Overdue">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                </span>
              )}
              {formatDateSmart(dueDate)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
