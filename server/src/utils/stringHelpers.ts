// String-related helper utilities
export function normalizeNullableString(val: string | undefined | null): string | null {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    return null;
  }
  return val;
}

// Add more string helpers here as needed
