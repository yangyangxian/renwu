export function getEditableTaskTableRowClassName(): string {
  return 'group relative grid min-h-14 items-center bg-transparent text-sm transition-colors hover:bg-muted/30 dark:hover:bg-muted/40';
}

export function getTaskTableDetailButtonClassName(): string {
  return 'h-7 w-7 shrink-0 rounded-full text-muted-foreground opacity-90 transition-[color,opacity] hover:opacity-100 focus-visible:opacity-100 dark:text-slate-200';
}