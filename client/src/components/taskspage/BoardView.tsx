import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-kit/Card";
import TaskCard from "@/components/taskspage/TaskCard";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";

interface BoardViewProps {
  tasks: TaskResDto[];
}

const statusColumns = [
  { key: TaskStatus.TODO, label: "To do", titleBg: "bg-amber-400 dark:bg-amber-600" },
  { key: TaskStatus.IN_PROGRESS, label: "In Progress", titleBg: "bg-blue-500 dark:bg-blue-700" },
  { key: TaskStatus.DONE, label: "Done", titleBg: "bg-green-500 dark:bg-green-700" },
  { key: TaskStatus.CLOSE, label: "Closed", titleBg: "bg-gray-500" }
];

const BoardView: React.FC<BoardViewProps> = React.memo(function BoardView({ tasks }) {
  console.log("BoardView component loaded");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {statusColumns.map((col) => (
        <Card key={col.key}>
          <CardHeader className={`py-[10px] px-3 flex items-center ${col.titleBg}`}>
            <CardTitle className="font-extralight text-white">{col.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex flex-col gap-3">
            {tasks.filter(task => task.status === col.key).length === 0 ? (
              <Label className="text-sm">No tasks</Label>
            ) : (
              tasks.filter(task => task.status === col.key).map((task, idx) => (
                <TaskCard
                  key={task.id || idx}
                  title={task.title}
                  description={task.description}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                  status={task.status}
                />
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default BoardView;
