import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiErrorResponse, ErrorCodes, HttpStatusCode } from '@fullstack/common';
import { CustomError } from '../classes/CustomError';
import configs from '../appConfig';
import { createApiResponse } from '../utils/apiUtils';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = configs.envMode == 'development';
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let errorCode = ErrorCodes.INTERNAL_ERROR;
  let errorMessage = 'An unexpected error occurred.';
  let errorStack = err.stack;

  if (err instanceof CustomError) {
    statusCode = HttpStatusCode.UNPROCESSABLE_ENTITY;

    errorCode = err.errorCode;
    errorMessage = err.message;
  }

  const apiErrorResponse: ApiErrorResponse = {
    code: errorCode,
    message: errorMessage,
    timestamp: (err instanceof CustomError) ? err.timestamp : new Date().toISOString(),
    ...(isDevelopment && { stack: errorStack }),
  };

  let errorLog = isDevelopment
    ? `[${req.method} ${req.originalUrl}] API Error(status code:${statusCode}) | Error Code: ${apiErrorResponse.code} | ${apiErrorResponse.stack}`
    : `[${req.method} ${req.originalUrl}] API Error(status code:${statusCode}): ${apiErrorResponse.code} | ${apiErrorResponse.message}`;
  logger.error(errorLog);

  const finalResponse = createApiResponse<null>(null, apiErrorResponse);
  res.status(statusCode).json(finalResponse);
};

export default errorHandler;
