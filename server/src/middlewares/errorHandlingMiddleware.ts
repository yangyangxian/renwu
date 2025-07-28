import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiErrorResponse, ErrorCodes, HttpStatusCode } from '@fullstack/common';
import { CustomError } from '../classes/CustomError';
import { createApiResponse } from '../utils/apiUtils';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let errorCode = ErrorCodes.INTERNAL_ERROR;
  let errorMessage = err.message || 'An unexpected error occurred';
  let errorStack = err.stack;

  if (err instanceof CustomError) {
    statusCode = HttpStatusCode.UNPROCESSABLE_ENTITY;

    errorCode = err.errorCode;
    errorMessage = err.message;
  }

  const apiErrorResponse: ApiErrorResponse = {
    code: errorCode,
    message: errorMessage,
    timestamp: (err instanceof CustomError) ? err.timestamp : new Date().toISOString()
  };

  let errorLog = `[${req.method} ${req.originalUrl}] API Error(status code:${statusCode}) | Error Code: ${apiErrorResponse.code} | Error Message: ${apiErrorResponse.message} | Stack: ${errorStack}`;
  logger.error(errorLog);

  const finalResponse = createApiResponse<null>(null, apiErrorResponse);
  res.status(statusCode).json(finalResponse);
};

export default errorHandler;
