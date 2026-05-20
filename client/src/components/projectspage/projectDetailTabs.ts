import { LayoutDashboard, BookOpen, Users, Tag, Settings, type LucideIcon } from 'lucide-react';

export type ProjectDetailTab = 'tasks' | 'wiki' | 'team' | 'labels' | 'settings';
export type ProjectDetailTabHash = ProjectDetailTab | 'overview';

export const PROJECT_DEFAULT_TAB: ProjectDetailTab = 'tasks';

export const PROJECT_DETAIL_TAB_HASH_VALUES: ProjectDetailTabHash[] = [
  'overview',
  'tasks',
  'wiki',
  'team',
  'labels',
  'settings',
];

export interface ProjectDetailTabMeta {
  value: ProjectDetailTab;
  label: string;
  icon: LucideIcon;
}

export const PROJECT_DETAIL_TABS: ProjectDetailTabMeta[] = [
  {
    value: 'tasks',
    label: 'Tasks',
    icon: LayoutDashboard,
  },
  {
    value: 'wiki',
    label: 'Wiki',
    icon: BookOpen,
  },
  {
    value: 'team',
    label: 'Team',
    icon: Users,
  },
  {
    value: 'labels',
    label: 'Labels',
    icon: Tag,
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function normalizeProjectDetailTab(tab: ProjectDetailTabHash): ProjectDetailTab {
  return tab === 'overview' ? 'wiki' : tab;
}