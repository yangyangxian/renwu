import React, { useMemo } from 'react';
import { UpcomingDeadlinesCard } from './overviewTab/UpcomingDeadlinesCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { RadioChartCard } from '@/components/projectspage/overviewTab/RadioChartCard';
import { ProjectDescriptionCard } from '@/components/projectspage/overviewTab/ProjectDescriptionCard';
import { TaskStatus, ProjectResDto } from '@fullstack/common';
import { TASK_STATUS_CONFIG } from './overviewTab/taskStatusConfig';
import logger from '@/utils/logger';

interface ProjectOverviewTabProps {
  project: ProjectResDto;
}

const CARD_CLASS = "shadow-sm p-4";
const MemoRadioChartCard = React.memo(RadioChartCard);

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  logger.debug('ProjectOverviewTab is rendering:');
  const { updateProject } = useProjectStore();
  const { projectTasks: tasks } = useTaskStore();
  const chartData = useMemo(() => {
    // Only use the main TaskStatus keys for chart
    logger.debug('ProjectOverviewTab chartData is re-computing');
    const chartKeys: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CLOSE];
    const statusCounts: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.CLOSE]: 0,
    };
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        const key = chartKeys.includes(task.status) ? task.status : TaskStatus.TODO;
        statusCounts[key]++;
      });
    }
    return chartKeys.map(key => ({
      key,
      value: statusCounts[key],
      label: TASK_STATUS_CONFIG[key].label,
      color: TASK_STATUS_CONFIG[key].color,
      dotClass: TASK_STATUS_CONFIG[key].dotClass,
    }));
  }, [tasks]);

  return (
    <div className="flex gap-3 p-2 items-start flex-1 overflow-y-auto">
      <div className="flex flex-col w-38/100 xl:w-29/100 gap-3 h-full">
        <MemoRadioChartCard data={chartData} className={CARD_CLASS} />
        <UpcomingDeadlinesCard tasks={tasks} className={CARD_CLASS} />
      </div>
      <ProjectDescriptionCard project={project} 
        updateProject={updateProject} 
        className={`${CARD_CLASS} py-2 pr-0 px-6`} />
    </div>
  );
}
