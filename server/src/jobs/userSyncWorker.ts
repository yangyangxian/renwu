import { Worker } from 'bullmq';
import appConfig from '../appConfig';
import { db } from '../database/databaseAccess';
import { users } from '../database/schema';
import { redisClient } from '../database/redisClient';
import { USERS_EMAILS_ZSET, userInfoKey } from '../database/redisKeys';
import logger from '../utils/logger';

const worker = new Worker('user-sync', async job => {
  if (job.name === 'sync-all-users') {
    logger.debug('Starting user sync for all users');
    // 1. Fetch all users from DB using Drizzle ORM
    const allUsers = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);
    if (!redisClient) throw new Error('Redis client not available');

    // 2. Fetch all user emails currently in Redis
    const redisEmails = await redisClient.zRange(USERS_EMAILS_ZSET, 0, -1);
    const dbEmails = allUsers.map(u => u.email);

    // 3. Find emails in Redis that are not in DB (to delete)
    const emailsToDelete = redisEmails.filter(email => !dbEmails.includes(email));

    // 4. Write to Redis (add/update)
    const pipeline = redisClient.multi();
    for (const user of allUsers) {
      pipeline.zAdd(USERS_EMAILS_ZSET, { score: 0, value: user.email });
      pipeline.set(userInfoKey(user.email), JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email
      }));
    }

    // 5. Remove stale users from Redis
    for (const email of emailsToDelete) {
      pipeline.zRem(USERS_EMAILS_ZSET, email);
      pipeline.del(userInfoKey(email));
    }

    await pipeline.exec();
    logger.info('User emails and info synced to Redis (including deletions)');
  } else if (job.name === 'sync-user') {
    // Add or update a single user in Redis
    const { id, email, name } = job.data;
    if (!id || !email) throw new Error('sync-user job missing id or email');
    if (!redisClient) throw new Error('Redis client not available');
    await redisClient.zAdd(USERS_EMAILS_ZSET, { score: 0, value: email });
    await redisClient.set(userInfoKey(email), JSON.stringify({ id, name, email }));
    logger.info(`User ${email} synced to Redis`);
  }
}, { connection: { url: appConfig.redisUrl } });

worker.on('completed', job => {
  logger.info(`Job ${job.id} completed!`);
});
worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});
