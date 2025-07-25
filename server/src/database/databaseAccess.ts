import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import configs from '../appConfig';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes } from '@fullstack/common';
import logger from '../utils/logger';

if (!configs.dbUrl || configs.dbUrl.trim() === '') {
  logger.error('DATABASE_URL is not set or is empty. Database operations will fail. Please check your environment variables.');
}

const queryClient = postgres(configs.dbUrl || '');
const rawDb = drizzle({ client: queryClient });

// Simple connection check function
function checkDbConnection() {
  if (!configs.dbUrl || configs.dbUrl.trim() === '') {
    logger.error('Database operation attempted but DATABASE_URL is not configured.');
    throw new CustomError('DATABASE_URL is not configured.', ErrorCodes.DATABASE_CONNECTION_NOT_CONFIGURED);
  }
}

// Simple wrapper that only checks connection - no error interception
const db = new Proxy(rawDb, {
  get(target: any, prop: string | symbol) {
    const originalValue = target[prop];

    // Only check connection for main database operations
    if (typeof originalValue === 'function' &&
        ['select', 'insert', 'update', 'delete', 'transaction'].includes(prop as string)) {
      return function(...args: any[]) {
        checkDbConnection();
        return originalValue.apply(target, args);
      };
    }

    return originalValue;
  }
});

export { db };