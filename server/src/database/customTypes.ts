import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom UUID type that automatically converts empty strings to null
 * This handles the common case where frontend sends empty strings for optional UUID fields
 */
export const nullableUuid = customType<{ 
  data: string | null; 
  driverData: string | null 
}>({
  dataType() {
    return 'uuid';
  },
  toDriver(value: string | null): string | null {
    // Convert empty strings to null before sending to database
    return value === '' ? null : value;
  },
  fromDriver(value: string | null): string | null {
    // Database already handles null correctly, just pass through
    return value;
  },
});

/**
 * Custom text type that automatically converts empty strings to null
 * This handles the common case where frontend sends empty strings for optional text fields
 */
export const nullableText = customType<{ 
  data: string | null; 
  driverData: string | null 
}>({
  dataType() {
    return 'text';
  },
  toDriver(value: string | null): string | null {
    // Convert empty strings to null before sending to database
    return value === '' ? null : value;
  },
  fromDriver(value: string | null): string | null {
    // Database already handles null correctly, just pass through
    return value;
  },
});

/**
 * Custom varchar type that automatically converts empty strings to null
 * This handles the common case where frontend sends empty strings for optional varchar fields
 */
export const nullableVarchar = (length?: number) => customType<{ 
  data: string | null; 
  driverData: string | null;
  config: { length?: number };
}>({
  dataType(config) {
    return config?.length ? `varchar(${config.length})` : 'varchar';
  },
  toDriver(value: string | null): string | null {
    // Convert empty strings to null before sending to database
    return value === '' ? null : value;
  },
  fromDriver(value: string | null): string | null {
    // Database already handles null correctly, just pass through
    return value;
  },
})({ length });

/**
 * Custom nullable timestamp type that automatically converts empty strings to null
 * This handles the common case where frontend sends empty strings for optional date fields
 */
export const nullableTimestamp = customType<{ 
  data: Date | null; 
  driverData: string | null;
  config: { withTimezone?: boolean; precision?: number };
}>({
  dataType(config) {
    const precision = config?.precision ? `(${config.precision})` : '';
    const timezone = config?.withTimezone ? ' with time zone' : '';
    return `timestamp${precision}${timezone}`;
  },
  toDriver(value: Date | string | null): string | null {
    // Convert empty strings to null, dates to ISO strings
    if (value === '' || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') {
      // If it's a valid date string, convert to Date then to ISO
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  },
  fromDriver(value: string | null): Date | null {
    // Convert database timestamp strings back to Date objects
    return value ? new Date(value) : null;
  },
});
