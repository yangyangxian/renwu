// Shared route matching utility for public/protected route checks
export function matchRoutePattern(path: string, patterns: string[]): boolean {
  // Remove query string and trailing slash
  const cleanPath = path.replace(/\/$/, '').split('?')[0];
  return patterns.some(pattern => {
    const cleanPattern = pattern.replace(/\/$/, '');
    const pathSegments = cleanPath.split('/').filter(Boolean);
    const patternSegments = cleanPattern.split('/').filter(Boolean);
    if (pathSegments.length !== patternSegments.length) return false;
    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(':') || patternSegments[i].startsWith('[')) continue; // dynamic segment
      if (patternSegments[i] !== pathSegments[i]) return false;
    }
    return true;
  });
}
