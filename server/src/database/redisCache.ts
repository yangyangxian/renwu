// @ts-ignore
import { redisClient, isRedisAvailable } from './redisClient';
import logger from '../utils/logger';

export async function getCachedValue<T = any>(cacheKey: string): Promise<T | undefined> {
  if (redisClient && isRedisAvailable()) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.error('Redis error (get):', err);
    }
  } else {
    logger.warn('Redis client is not available or Redis is not configured.');
  }
  return undefined;
}

export async function setCachedValue<T = any>(cacheKey: string, value: T): Promise<void> {
  if (redisClient && isRedisAvailable()) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(value), { EX: 60 * 30 });
    } catch (err) {
      logger.error('Redis error (set):', err);
    }
  }
}
