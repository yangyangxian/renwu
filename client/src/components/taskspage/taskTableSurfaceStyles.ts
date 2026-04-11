const taskTableMutedSurfaceClassName = 'border border-transparent bg-muted/40 dark:bg-muted/65';

export function getTaskTableGroupByCardClassName(): string {
  return `flex items-center gap-2 rounded-md ${taskTableMutedSurfaceClassName} py-2 pl-5 pr-3`;
}

export function getTaskTableGroupByTriggerClassName(): string {
  return 'w-full bg-background text-foreground dark:text-white';
}

export function getTaskTableCardClassName(): string {
  return `overflow-hidden rounded-lg ${taskTableMutedSurfaceClassName}`;
}