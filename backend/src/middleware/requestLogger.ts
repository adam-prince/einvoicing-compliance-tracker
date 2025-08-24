import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Generate request ID if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = generateRequestId();
  }

  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log request completion
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      requestId: req.headers['x-request-id'],
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('content-length'),
      userId: (req as any).user?.id,
    });

    return originalJson.call(this, body);
  };

  next();
};

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}