import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { hrtime } from 'node:process';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = hrtime.bigint();

  res.on('finish', () => {

    const end = hrtime.bigint();
    const durationInMs = Number((end - start) / BigInt(1000000)); 

    // Format duration properly - avoid scientific notation
    const formattedDuration = durationInMs < 1 
      ? `${durationInMs.toFixed(2)}` 
      : `${Math.round(durationInMs)}`;

    let requestLog = `${req.method} ${req.originalUrl} | Status Code: ${res.statusCode} | ${formattedDuration} ms `;
    if (req.method == 'GET') {
      requestLog = requestLog + `| Param: ${JSON.stringify(req.params)} `;
    }
    if (req.method == 'POST') {
      requestLog = requestLog + `| Body: ${JSON.stringify(req.body)} `;
    }
    logger.info(requestLog); 
  });

  next();
};

export default requestLogger; 