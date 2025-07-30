import { scheduleUserRedisSyncJob } from '../jobs/userSyncQueue';
import bcrypt from 'bcryptjs';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes } from '@fullstack/common';
import { db } from '../database/databaseAccess';
import { users } from '../database/schema';
import { eq, ilike } from 'drizzle-orm';
import logger from '../utils/logger';
import { isRedisAvailable, redisClient } from '../database/redisClient';
import { userInfoKey, USERS_EMAILS_ZSET } from '../database/redisKeys';

export class UserEntity {
  id: string = '';
  name: string = '';
  email: string = '';
  password?: string = '';
  createdAt: string = '';

  constructor(init?: Partial<UserEntity>) {
    Object.assign(this, init);
  }
}

class UserService {
  async searchUsersByEmail(emailPart: string, limit: number = 10): Promise<UserEntity[]> {
    // Use ilike for case-insensitive partial match in Drizzle ORM
    if (!emailPart) return [];
    const query = ilike(users.email, `%${emailPart}%`);
    const result = await db.select().from(users)
      .where(query)
      .limit(limit);
    logger.debug('UserService.searchUsersByEmail result number:', result.length);
    return result.map((user: { id: string, name: string, email: string, createdAt: Date | null, updatedAt: Date | null }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt ? user.createdAt.toISOString() : '',
    }));
  }

  async searchUserEmailsByPrefixRedis(emailPart: string, limit: number = 10): Promise<UserEntity[]> {
    logger.debug('Searching user emails by prefix in Redis:', emailPart);
    if (!redisClient || !isRedisAvailable() || !emailPart) return [];
    // Compute min and max for ZRANGEBYLEX
    const min = `[${emailPart}`;
    const max = (() => {
      if (!emailPart) return "+";
      const arr = emailPart.split("");
      let i = arr.length - 1;
      while (i >= 0) {
        const code = arr[i].charCodeAt(0);
        if (code < 0x7f) { arr[i] = String.fromCharCode(code + 1); break; }
        i--;
      }
      return `[${arr.join("")}`;
    })();

    let emails: string[] = [];
    try {
      emails = await redisClient.zRangeByLex(USERS_EMAILS_ZSET, min, max, { LIMIT: { offset: 0, count: limit } });
    } catch (err) {
      logger.warn('Redis zRangeByLex failed:', err);
      return [];
    }

    if (!emails.length) return [];
    const userJsons = await Promise.all(
      emails.map(email => redisClient!.get(userInfoKey(email)))
    );
    return userJsons
      .map(j => { try { return j ? JSON.parse(j) : null; } catch { return null; } })
      .filter(Boolean)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt || '',
      }));
  }
  
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    logger.debug('Fetching user by email:', email);
    const result = await db.select().from(users).where(eq(users.email, email));
    if (result.length === 0) return null;
    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.passwordHash,
      createdAt: user.createdAt?.toISOString?.() ?? '',
    };
  }

  async createUser({ name, email, password }: { name: string; email: string; password: string }): Promise<UserEntity> {
    if (await this.getUserByEmail(email)) {
      throw new CustomError('Email already exists', ErrorCodes.EMAIL_ALREADY_EXISTS);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db.insert(users).values({
      name,
      email,
      passwordHash,
    }).returning();
    const user = inserted[0];
    const userEntity = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt?.toISOString?.() ?? '',
    };
    // Schedule Redis sync job for this user
    await scheduleUserRedisSyncJob({ id: user.id, name: user.name, email: user.email });
    return userEntity;
  }

  async updateUser(userId: string, fields: Partial<Omit<UserEntity, 'id' | 'createdAt' | 'password'>>): Promise<UserEntity> {
    logger.debug('Updating user with fields:', fields + userId);

    const updateFields: Record<string, any> = {};
    (Object.keys(fields) as Array<keyof typeof fields>).forEach((key) => {
      if (fields[key] !== undefined) {
        updateFields[key] = fields[key];
      }
    });
    if (Object.keys(updateFields).length === 0) {
      throw new CustomError('No fields to update', ErrorCodes.VALIDATION_ERROR);
    }
    try {
      const updated = await db.update(users)
        .set(updateFields)
        .where(eq(users.id, userId))
        .returning();

      const user = updated[0];
      const userEntity = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt?.toISOString?.() ?? '',
      };
      // Schedule Redis sync job for this user
      await scheduleUserRedisSyncJob({ id: user.id, name: user.name, email: user.email });
      return userEntity;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new CustomError('Failed to update user', ErrorCodes.INTERNAL_ERROR);
    }
  }
}

export const userService = new UserService();
