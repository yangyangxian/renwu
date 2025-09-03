/**
 * maskDatabaseUrl.ts
 * Utility to mask sensitive parts of a database URL for safe logging.
 */
export default function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol; // e.g. postgresql:
    const host = parsed.host; // hostname:port
    const pathname = parsed.pathname || '';
    const search = parsed.search || '';
    const user = parsed.username || '';
    const userPart = user ? `${user}:***@` : '';
    return `${protocol}//${userPart}${host}${pathname}${search}`;
  } catch (e) {
    // Fallback: hide anything between the first ':' and the first '@'
    try {
      return url.replace(/:([^@]+)@/, ':***@');
    } catch (e2) {
      return '***masked***';
    }
  }
}
