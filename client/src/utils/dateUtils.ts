// Utility function to format a date string as a locale date (no time)
export function formatDate(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; 
  return date.toLocaleDateString();
}
