import { Queue } from 'bullmq';
import appConfig from '../appConfig';
import { redisClient } from '../database/redisClient';
import logger from '../utils/logger';

export const userSyncQueue = new Queue('user-sync', { connection: { url: appConfig.redisUrl } });

// Add a user sync job, but only if a Redis lock can be acquired
// TTL (lock expiration) is set to 30 seconds, which should be longer than the expected sync duration
// If the lock is held, other processes will not add a new job until it expires
export async function scheduleUserSyncJob() {
  const lockKey = 'user-sync:lock';
  const lastSyncKey = 'user-sync:last-sync';
  const ttl = 30 * 1000; // 30 seconds for lock
  const minInterval = 5 * 60 * 1000; // 5 minutes between syncs

  if (!redisClient) {
    throw new Error('Redis client is not initialized');
  }

  // Check last sync timestamp
  const lastSync = await redisClient.get(lastSyncKey);
  const now = Date.now();
  if (lastSync && (now - Number(lastSync)) < minInterval) {
    // Last sync was too recent, skip scheduling
    logger.debug('User sync job is already scheduled or running, skipping this time');
    return;
  }

  // Try to acquire lock
const lock = await redisClient.set(lockKey, 'locked', { NX: true, PX: ttl });
  if (lock) {
    // Lock acquired, safe to add job
    logger.debug('Acquired lock for user sync, scheduling job');
    await userSyncQueue.add('sync-all-users', {});
    // Update last sync timestamp
    await redisClient.set(lastSyncKey, now.toString());
  } else {
    // Lock not acquired, another process is already scheduling or running the job
  }
}

  // Add or update a single user in Redis via a job
export async function scheduleUserRedisSyncJob(user: { id: string, email: string, name: string }) {
  if (!redisClient) throw new Error('Redis client is not initialized');
  // Always enqueue a new job for user sync
  await userSyncQueue.add('sync-user', user);
}
