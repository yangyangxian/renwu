import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import appConfig from '../appConfig';

let redisClient: RedisClientType | undefined;
let redisConnected = false;

if (appConfig.redisEnabled) {
  try {
    redisClient = createClient({
      url: appConfig.redisUrl || 'redis://localhost:6379',

      socket: {
        reconnectStrategy: () => {
          return 2147483647;
        }
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      redisConnected = true;
    });

    // Automatically connect to Redis on startup when explicitly enabled.
    void (async () => {
      try {
        await redisClient.connect();
        redisConnected = true;
      } catch (err) {
        logger.error('Failed to connect to Redis:', err);
        redisConnected = false;
      }
    })();
  } catch (err) {
    logger.error('Failed to initialize Redis client:', err);
    redisClient = undefined;
    redisConnected = false;
  }
}

function isRedisAvailable() {
  return appConfig.redisEnabled && redisConnected;
}

// Usage: always wrap redisClient.get/set in try/catch in your API code
export { redisClient, redisConnected, isRedisAvailable };
