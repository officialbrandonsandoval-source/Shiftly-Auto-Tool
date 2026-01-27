/**
 * Correlation ID middleware
 * Generates unique ID for each request to trace through the system
 */
import crypto from 'crypto';
/**
 * Middleware to add correlation ID to each request
 */
export function correlationIdMiddleware(req, res, next) {
    // Check if correlation ID was provided
    const providedId = req.headers['x-correlation-id'];
    const correlationId = providedId || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}
/**
 * Get current correlation ID from request
 */
export function getCorrelationId(req) {
    return req.correlationId || 'unknown';
}
/**
 * Log with correlation ID for debugging
 */
export function logWithCorrelation(correlationId, level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${correlationId}] [${level}]`;
    if (data) {
        console.log(`${prefix} ${message}`, data);
    }
    else {
        console.log(`${prefix} ${message}`);
    }
}
//# sourceMappingURL=correlation.js.map