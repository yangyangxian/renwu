import { defineConfig } from 'drizzle-kit';
import appConfig from './src/appConfig.ts';
export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: appConfig.dbUrl!,
  },
});