export function getProjectRowButtonClassName(hasTaskViews: boolean) {
  return [
    'pl-4',
    'flex-1',
    'min-w-0',
    hasTaskViews ? 'pr-8' : '',
  ]
    .filter(Boolean)
    .join(' ');
}