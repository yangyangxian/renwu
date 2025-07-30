import express from 'express';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import configs from './appConfig';
import logger from './utils/logger';
import apiRouter, { publicRouters } from './routes/apiRouter';
import staticRouter from './routes/staticRouter';
import requestLoggerMiddleware from './middlewares/requestLoggerMiddleware';
import errorHandlingMiddleware from './middlewares/errorHandlingMiddleware';
import corsMiddleware from './middlewares/corsMiddleware';
import { globalAuthMiddleware } from './middlewares/authMiddleware';
import { scheduleUserSyncJob } from './jobs/userSyncQueue';

const app = express();

// ********************************************************
// Load Middlewares
// ********************************************************
app.use(corsMiddleware); // CORS must be applied before other middleware
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON bodies
app.use(requestLoggerMiddleware);

// ********************************************************  
// Load API Routes
// ********************************************************
app.use(publicRouters); 
app.use(staticRouter); // Static file routes (SPA routing) - no auth needed

app.use("/api", globalAuthMiddleware); // Authenticated API routes with auth middleware
app.use(apiRouter); 

// ********************************************************
// Load Final Middleware
// ********************************************************
app.use(errorHandlingMiddleware); // Error handling must be the last middleware

// ********************************************************
// Start the server
// ********************************************************
StartServer(configs.port);

// Schedule user sync job on startup (safe for multi-instance)
scheduleUserSyncJob();

export default app;

// ********************************************************
// Private functions
// ********************************************************
function StartServer(port: number): void {
  const server: Server = app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port} in ${configs.envMode} mode.`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
      StartServer(port + 1);
    } else {
      logger.error('Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      logger.info('Server closed gracefully.');
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}