import React, { useEffect } from 'react';
import { UpcomingDeadlinesCard } from './overviewTab/UpcomingDeadlinesCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { ProjectActivityCard } from '@/components/projectspage/overviewTab/ProjectActivityCard';
import { ProjectDocumentsCard } from '@/components/projectspage/overviewTab/ProjectDocumentsCard';
import { ProjectResDto } from '@fullstack/common';
import logger from '@/utils/logger';

interface ProjectOverviewTabProps {
  project: ProjectResDto;
}

const CARD_CLASS = "shadow-sm p-4";

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  logger.debug('ProjectOverviewTab is rendering:');
  const {
    createProjectDocument,
    updateProjectDocument,
    deleteProjectDocument,
    projectActivities,
    projectActivitiesLoading,
    projectActivitiesError,
    fetchProjectActivities,
  } = useProjectStore();
  const { projectTasks: tasks } = useTaskStore();

  useEffect(() => {
    if (!project.id) {
      return;
    }

    void fetchProjectActivities(project.id);
  }, [project.id, project.documents, tasks, fetchProjectActivities]);

  return (
    <div className="flex gap-3 p-2 items-start flex-1 overflow-y-auto">
      <div className="flex h-full w-[41%] flex-col gap-3 xl:w-[32%]">
        <ProjectActivityCard
          activities={projectActivities}
          loading={projectActivitiesLoading}
          error={projectActivitiesError}
          className={CARD_CLASS}
        />
        <UpcomingDeadlinesCard tasks={tasks} className={CARD_CLASS} />
      </div>
      <ProjectDocumentsCard project={project}
        createProjectDocument={createProjectDocument}
        updateProjectDocument={updateProjectDocument}
        deleteProjectDocument={deleteProjectDocument}
        className={`${CARD_CLASS} h-full w-[59%] py-2 xl:w-[68%]`} />
    </div>
  );
}
