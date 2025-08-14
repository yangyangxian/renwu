import express from 'express';
import path from 'path';
import { staticDistDir } from '../utils/path';
import logger from '../utils/logger';

/**
 * Static Files Router
 * 
 * This router serves static files from the client build directory and handles
 * client-side routing by serving index.html for non-API routes.
 * 
 * Features:
 * - Serves static assets (CSS, JS, images, etc.) from the client build directory
 * - Handles client-side routing by serving index.html for all non-API routes
 * - Excludes API routes from the SPA fallback
 */

const clientBuildPath = staticDistDir;

const staticRouter = express.Router();

// Custom cache strategy: long cache for hashed files, short for others
staticRouter.use(express.static(clientBuildPath, {
  setHeaders: (res, filePath) => {
    // If file name contains a hash or unique string before the extension, cache for 1 year
    // Matches e.g. main.abc12345.js, vendor-marked-DJbTXz-_.js, chunk.12345678.map
    if (/[-._][A-Za-z0-9_-]{6,}\./.test(filePath)) {
      // 1 month = 2628000 seconds
      res.setHeader('Cache-Control', 'public, max-age=2628000, immutable');
    } else {
      // Otherwise, cache for 1 hour only
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Handle client-side routing - serve index.html for all non-API routes
// This regex matches any route that doesn't start with '/api/'
staticRouter.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

logger.info(`Static files router configured. Serving from: ${clientBuildPath}`);

export default staticRouter;
