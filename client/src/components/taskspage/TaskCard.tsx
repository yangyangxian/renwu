import React from "react";
import { Card } from "@/components/ui-kit/Card";

interface TaskCardProps {
  title: string;
  subtitle: string;
  description: string;
  dueDate?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, subtitle, description, dueDate }) => (
  <Card className="bg-muted dark:bg-black p-3">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-base font-medium leading-tight line-clamp-2">{title}</h3>
      {dueDate && <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{dueDate}</span>}
    </div>
    <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{subtitle}</div>
    <div className="text-xs text-foreground/70 line-clamp-3">{description}</div>
  </Card>
);

export default TaskCard;
