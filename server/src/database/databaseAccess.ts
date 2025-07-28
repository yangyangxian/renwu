import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import configs from '../appConfig';
import logger from '../utils/logger';

const queryClient = postgres(configs.dbUrl || '');
const rawDb = drizzle({ client: queryClient });

(async function verifyDbConnection() {
  if (!configs.dbUrl || configs.dbUrl.trim() === '') {
    logger.error('DATABASE_URL is not set or is empty. Database operations will fail. Please check your environment variables.');
    return false;
  }
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (err: any) {
    logger.error('Failed to connect to PostgreSQL:', {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      stack: err?.stack
    });
    return false;
  }
})();

const db = rawDb;

export { db };