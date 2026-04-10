type TaskTableLikeLabel = {
  id: string;
  labelName?: string;
  name?: string;
};

type TaskTableLikeTask = {
  id: string;
  labels?: TaskTableLikeLabel[];
};

type TaskTableLikeLabelSet = {
  id: string;
  name?: string;
  labelSetName?: string;
  labels?: TaskTableLikeLabel[];
} | null;

export interface TaskTableSection {
  key: string;
  title: string | null;
  taskIds: string[];
  isUngrouped: boolean;
}

interface CreateTaskTableSectionsOptions {
  tasks: TaskTableLikeTask[];
  labelSet: TaskTableLikeLabelSet;
}

const UNASSIGNED_SECTION_TITLE = 'Unassigned';

export function createTaskTableSections({ tasks, labelSet }: CreateTaskTableSectionsOptions): TaskTableSection[] {
  if (!labelSet) {
    return [
      {
        key: 'all-tasks',
        title: null,
        taskIds: tasks.map((task) => task.id),
        isUngrouped: true,
      },
    ];
  }

  const labels = Array.isArray(labelSet.labels) ? labelSet.labels : [];
  const labelIds = new Set(labels.map((label) => label.id));
  const sections = labels.map<TaskTableSection>((label) => ({
    key: `label:${label.id}`,
    title: label.name ?? label.labelName ?? '',
    taskIds: [],
    isUngrouped: false,
  }));

  const sectionByLabelId = new Map(sections.map((section, index) => [labels[index].id, section]));
  const unassignedSection: TaskTableSection = {
    key: 'unassigned',
    title: UNASSIGNED_SECTION_TITLE,
    taskIds: [],
    isUngrouped: false,
  };

  for (const task of tasks) {
    const matchingLabel = (task.labels ?? []).find((label) => labelIds.has(label.id));
    if (!matchingLabel) {
      unassignedSection.taskIds.push(task.id);
      continue;
    }

    const targetSection = sectionByLabelId.get(matchingLabel.id);
    if (targetSection) {
      targetSection.taskIds.push(task.id);
    } else {
      unassignedSection.taskIds.push(task.id);
    }
  }

  return [...sections, unassignedSection];
}

export { UNASSIGNED_SECTION_TITLE };