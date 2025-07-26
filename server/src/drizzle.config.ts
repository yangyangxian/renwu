import { defineConfig } from 'drizzle-kit';
import appConfig from './appConfig';

// Use schema path from appConfig, which can be set for dev/prod
export default defineConfig({
  out: './drizzle',
  schema: appConfig.schemaPath || './database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: appConfig.dbUrl!,
  },
});
