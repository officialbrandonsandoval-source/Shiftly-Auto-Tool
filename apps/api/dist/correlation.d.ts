/**
 * Correlation ID middleware
 * Generates unique ID for each request to trace through the system
 */
import { Request, Response, NextFunction } from 'express';
export interface RequestWithCorrelation extends Request {
    correlationId?: string;
}
/**
 * Middleware to add correlation ID to each request
 */
export declare function correlationIdMiddleware(req: RequestWithCorrelation, res: Response, next: NextFunction): void;
/**
 * Get current correlation ID from request
 */
export declare function getCorrelationId(req: RequestWithCorrelation): string;
/**
 * Log with correlation ID for debugging
 */
export declare function logWithCorrelation(correlationId: string, level: string, message: string, data?: any): void;
//# sourceMappingURL=correlation.d.ts.map