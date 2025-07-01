import React from "react";
import { Card } from "@/components/ui-kit/Card";
import { formatDate } from "@/utils/dateUtils";
import { TaskStatus } from "@fullstack/common";
interface TaskCardProps {
  title: string;
  description: string;
  dueDate?: string;
  projectName?: string;
  status?: TaskStatus;
}

const statusToColor: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "text-amber-400 dark:text-amber-600",
  [TaskStatus.IN_PROGRESS]: "text-blue-500 dark:text-blue-700",
  [TaskStatus.DONE]: "text-green-500 dark:text-green-700",
  [TaskStatus.CLOSE]: "text-gray-500",
};

const TaskCard: React.FC<TaskCardProps> = ({ title, dueDate, projectName, status }) => (
  <Card
    className="bg-muted dark:bg-black p-3 shadow transition hover:shadow-lg hover:scale-102 cursor-pointer duration-200"
    tabIndex={0}
    aria-label={title}
  >
    {projectName && (
      <div className={`text-xs mb-1 font-medium font-sans ${status ? statusToColor[status] : 'text-blue-500'}`}>{projectName}</div>
    )}
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-xs line-clamp-3">{title}</h3>
      {dueDate && (
        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap bg-transparent px-2 py-0.5 rounded font-sans">
          {formatDate(dueDate)}
        </span>
      )}
    </div>
  </Card>
);

export default TaskCard;
