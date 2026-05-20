import { ProjectResDto } from '@fullstack/common';

import { useProjectStore } from '@/stores/useProjectStore';
import { ProjectDocumentsCard } from '@/components/projectspage/overviewTab/ProjectDocumentsCard';
import { PROJECT_WIKI_PANEL_CLASS } from './projectDetailLayout';

interface ProjectWikiTabProps {
  project: ProjectResDto;
}

const WIKI_CARD_CLASS = 'shadow-sm p-4 h-full w-full py-2';

export function ProjectWikiTab({ project }: ProjectWikiTabProps) {
  const {
    createProjectDocument,
    updateProjectDocument,
    deleteProjectDocument,
  } = useProjectStore();

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto p-2">
      <div className={PROJECT_WIKI_PANEL_CLASS}>
        <ProjectDocumentsCard
          project={project}
          createProjectDocument={createProjectDocument}
          updateProjectDocument={updateProjectDocument}
          deleteProjectDocument={deleteProjectDocument}
          className={WIKI_CARD_CLASS}
        />
      </div>
    </div>
  );
}