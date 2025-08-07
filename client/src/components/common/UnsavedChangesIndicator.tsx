export function UnsavedChangesIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-200 rounded text-xs font-medium">
      <div className="w-1.5 h-1.5 bg-primary-purple dark:bg-purple-100 rounded-full"></div>
      Unsaved changes
    </div>
  );
}
