import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import configs from '../appConfig.js';
import { CustomError } from '../classes/CustomError.js';
import { ErrorCodes } from '@fullstack/common';
import logger from '../utils/logger.js';

if (!configs.dbUrl || configs.dbUrl.trim() === '') {
  logger.error('DATABASE_URL is not set or is empty. Database operations may fail. Please check your environment variables.');
}

const queryClient = postgres(configs.dbUrl || '');

const db = drizzle({ client: queryClient});

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!configs.dbUrl || configs.dbUrl.trim() === '') {
    throw new CustomError(
      'DATABASE_URL is not configured.',
      ErrorCodes.DATABASE_CONNECTION_NOT_CONFIGURED
    );
  }
  
  try {
    const result = await queryClient.unsafe(query, params);
    return result as unknown as T[];
  } catch (error) {
    throw error;
  }
}

export { db };