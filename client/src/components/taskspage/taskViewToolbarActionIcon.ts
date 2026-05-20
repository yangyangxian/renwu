import { Bookmark, BookmarkPlus, type LucideIcon } from 'lucide-react';

export function getTaskViewToolbarActionIcon(hasSelectedTaskView: boolean): LucideIcon {
  return hasSelectedTaskView ? Bookmark : BookmarkPlus;
}