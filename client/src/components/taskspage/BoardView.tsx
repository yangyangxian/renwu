import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-kit/Card";
import TaskCard from "@/components/taskspage/TaskCard";

interface BoardViewProps {
  tasks: {
    title: string;
    subtitle: string;
    description: string;
    dueDate?: string;
    status: "todo" | "inprogress" | "done" | "close";
  }[];
}

const statusColumns = [
  { key: "todo", label: "To do", titleBg: "bg-amber-400 dark:bg-amber-600" },
  { key: "inprogress", label: "In Progress", titleBg: "bg-blue-500 dark:bg-blue-700" },
  { key: "done", label: "Done", titleBg: "bg-green-500 dark:bg-green-700" },
  { key: "close", label: "Closed", titleBg: "bg-gray-500" }
];

const BoardView: React.FC<BoardViewProps> = ({ tasks }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
    {statusColumns.map((col) => (
      <Card key={col.key}>
        <CardHeader className={`py-[10px] px-3 flex items-center ${col.titleBg}`}>
          <CardTitle className="font-extralight text-white">{col.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex flex-col gap-3">
          {tasks.filter(task => task.status === col.key).length === 0 ? (
            <div className="text-md">No tasks</div>
          ) : (
            tasks.filter(task => task.status === col.key).map((task, idx) => (
              <TaskCard key={idx} title={task.title} subtitle={task.subtitle} description={task.description} />
            ))
          )}
        </CardContent>
      </Card>
    ))}
  </div>
);

export default BoardView;
