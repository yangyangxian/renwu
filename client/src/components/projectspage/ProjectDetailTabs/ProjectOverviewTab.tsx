import React, { useMemo } from 'react';
import { UpcomingDeadlinesCard } from './UpcomingDeadlinesCard';
import { Card } from '@/components/ui-kit/Card';
import { Textarea } from '@/components/ui-kit/Textarea';
import { marked } from 'marked';
import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { toast } from 'sonner';
import { RadioChartCard } from '@/components/RadioChartCard';
import { TaskStatus, ProjectResDto } from '@fullstack/common';

const statusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
  [TaskStatus.TODO]: {
    label: 'To Do',
    color: '#f59e42',
    dotClass: 'bg-amber-400',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#2563eb',
    dotClass: 'bg-blue-600',
  },
  [TaskStatus.DONE]: {
    label: 'In Review',
    color: '#10b981',
    dotClass: 'bg-emerald-500',
  },
  [TaskStatus.CLOSE]: {
    label: 'Done',
    color: '#a3a3a3',
    dotClass: 'bg-gray-400',
  },
};

interface ProjectOverviewTabProps {
  project: ProjectResDto;
}

const MemoRadioChartCard = React.memo(RadioChartCard);

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const { updateProject } = useProjectStore();
  const { projectTasks: tasks } = useTaskStore();
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (project) {
      setDescInput(project.description || "");
    }
    setEditingDesc(false);
  }, [project]);

  const handleDescClick = () => {
    setEditingDesc(true);
    setTimeout(() => {
      if (descInputRef.current) {
        descInputRef.current.focus();
        const val = descInputRef.current.value;
        descInputRef.current.setSelectionRange(val.length, val.length);
      }
    }, 0);
  };

  const handleSubmitDes = async (newValue: string) => {
    setEditingDesc(false);
    setDescInput(newValue);
    if (!project) return;
    try {
      await updateProject(project.id, { description: newValue });
      toast.success('Project description updated');
    } catch {
      toast.error('Failed to update description');
      setDescInput(project.description || "");
    }
  };

  const chartData = useMemo(() => {
    const statusKeys = Object.keys(statusConfig);
    const statusCounts: Record<string, number> = {};
    statusKeys.forEach(key => { statusCounts[key] = 0; });
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        // Normalize status key (assume task.status matches TaskStatus values)
        const key = String(task.status).toLowerCase();
        if (statusCounts.hasOwnProperty(key)) {
          statusCounts[key]++;
        }
      });
    }
    return statusKeys.map(key => ({
      key,
      value: statusCounts[key],
      label: statusConfig[key].label,
      color: statusConfig[key].color,
      dotClass: statusConfig[key].dotClass,
    }));
  }, [tasks]);

  return (
    <div className="flex gap-3 p-2 items-start flex-1 overflow-y-auto">
      <div className="flex flex-col w-1/3 lg:w-29/100 gap-3 h-full">
        <MemoRadioChartCard data={chartData} />
        <UpcomingDeadlinesCard tasks={tasks} />
      </div>
      <Card className="flex flex-1 flex-col h-full shadow-md px-4">
        {editingDesc ? (
          <Textarea
            ref={descInputRef}
            initialValue={descInput}
            onSubmit={handleSubmitDes}
            onCancel={() => setEditingDesc(false)}
            className="min-h-40 my-4"
            maxLength={10000}
            storageKey={project?.id}
          />
        ) : (
          <>
            {descInput ? (
              <div
                className="markdown-body !text-[0.95rem] !leading-5 !bg-card !py-3 h-full cursor-pointer overflow-auto"
                onClick={handleDescClick}
                dangerouslySetInnerHTML={{ __html: marked.parse(descInput || '') }}
              />
            ) : (
              <div
                className="markdown-body !text-[0.95rem] !bg-card p-4 pt-5 cursor-pointer text-muted-foreground italic"
                onClick={handleDescClick}
              >
                Enter a project description… (Markdown supported!)
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
