import dotenv from 'dotenv';
import fs from 'fs';
/**
 * Handles environment variable loading and provides type-safe configuration access
 */
class AppConfig {
  public readonly port: number;
  public readonly dbUrl: string;
  public readonly envMode: string;
  public readonly corsEnabled: boolean;
  public readonly corsOrigins: string[];
  public readonly staticDir: string;
  public readonly jwtSecret: string;
  public readonly jwtMaxAge: number; // in milliseconds
  public readonly redisUrl: string;
  public readonly schemaPath: string;
  public readonly resendApiKey: string;
  public readonly logLevel: string;
  // Aliyun OSS config
  public readonly ossAccessKeyId: string;
  public readonly ossAccessKeySecret: string;
  public readonly ossBucket: string;
  public readonly ossEndpoint: string;
  public readonly ossRegion: string;

  constructor() {
    // Load environment variables
    this.loadEnvironmentFiles();
    this.logLevel = this.getEnv('LOG_LEVEL', 'info'); // Default log level
    
    // Initialize configuration properties
    this.port = parseInt(this.getEnv('PORT', '5050'), 10);
    this.dbUrl = this.getEnv('DATABASE_URL', '');
    this.envMode = this.getEnv('NODE_ENV', 'development');
    this.corsEnabled = this.getEnv('CORS_ENABLED', 'false').toLowerCase() === 'true';
    this.corsOrigins = this.getEnv('CORS_ORIGINS', 'http://localhost:5183,http://localhost:3000')
      .split(',')
      .map(origin => origin.trim());
    this.staticDir = this.getEnv('STATIC_DIR', '../../client/dist');
    this.jwtSecret = this.getEnv('JWT_SECRET', '');
    this.jwtMaxAge = parseInt(this.getEnv('JWT_MAX_AGE', '604800000'), 10); // Default to 7 days in ms
    this.redisUrl = this.getEnv('REDIS_URL', 'redis://localhost:6379');
    this.schemaPath = this.envMode === 'production' ? '/app/server/dist/database/schema.js' : './src/database/schema.ts';
    this.resendApiKey = this.getEnv('RESEND_API_KEY', '');
    this.logLevel = this.getEnv('LOG_LEVEL', 'info'); // Default log level
    // Aliyun OSS config - prefer OSS_* names, fall back to ALI_OSS_*; use getEnv for consistent access
    this.ossAccessKeyId = this.getEnv('OSS_ACCESS_KEY_ID', this.getEnv('ALI_OSS_ACCESS_KEY_ID', ''));
    this.ossAccessKeySecret = this.getEnv('OSS_ACCESS_KEY_SECRET', this.getEnv('ALI_OSS_ACCESS_KEY_SECRET', ''));
    this.ossBucket = this.getEnv('OSS_BUCKET', this.getEnv('ALI_OSS_BUCKET', ''));
    this.ossEndpoint = this.getEnv('OSS_ENDPOINT', this.getEnv('ALI_OSS_ENDPOINT', ''));
    this.ossRegion = this.getEnv('OSS_REGION', this.getEnv('ALI_OSS_REGION', ''));
  }

  /**
   * Load environment files in the correct order
   */
  private loadEnvironmentFiles(): void {
    // Load default .env first
    dotenv.config({ path: '.env' });
    
    // Load env-specific file if it exists
    const envFile = `.env.${this.getEnv('NODE_ENV', 'development')}`;
    const envFile2 = `server/.env.${this.getEnv('NODE_ENV', 'development')}`; // For monorepo
    
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: true });
    } else if (fs.existsSync(envFile2)) {
      dotenv.config({ path: envFile2, override: true });
    } else {
      console.log(`Environment file ${envFile} not found`);
    }
  }

  /**
   * Get environment variable with optional fallback
   */
  private getEnv(key: string, fallback?: string): string {
    const value = process.env[key];
    if (value !== undefined) return value;
    if (fallback !== undefined) return fallback;
    
    throw new Error(`Missing required env var: ${key}`);
  }
}

// Create the singleton instance at module level
const appConfig = new AppConfig();

// Export the singleton instance
export default appConfig; 