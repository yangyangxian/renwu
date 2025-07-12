// Returns 'Today', 'Tomorrow', or formatted date
export function formatDateSmart(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const input = new Date(date);
  input.setHours(0, 0, 0, 0);
  if (input.getTime() === today.getTime()) return 'Today';
  if (input.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (input.getTime() === yesterday.getTime()) return 'Yesterday';
  // Return US date format (MM/DD/YYYY) for uniformity
  return date.toLocaleDateString('en-US');
}
