import React from "react";
import { TaskStatus } from "@fullstack/common";
import { Square, Loader2, CheckCircle, XCircle } from "lucide-react";

export const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "In Review",
  [TaskStatus.CLOSE]: "Done",
};

export const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-800 dark:text-amber-50 dark:border-amber-800",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
  [TaskStatus.DONE]: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  [TaskStatus.CLOSE]: "bg-gray-200 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
};

export const statusIcons: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.TODO]: <Square className="w-4 h-4 text-yellow-500 mx-1" />,
  [TaskStatus.IN_PROGRESS]: <Loader2 className="w-4 h-4 text-blue-500 mx-1 animate-spin-slow" />,
  [TaskStatus.DONE]: <CheckCircle className="w-4 h-4 text-green-500 mx-1" />,
  [TaskStatus.CLOSE]: <XCircle className="w-4 h-4 text-gray-400 mx-1" />,
};

export const allStatuses: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CLOSE,
];
