/**
 * Correlation ID middleware
 * Generates unique ID for each request to trace through the system
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export interface RequestWithCorrelation extends Request {
  correlationId?: string
}

/**
 * Middleware to add correlation ID to each request
 */
export function correlationIdMiddleware(req: RequestWithCorrelation, res: Response, next: NextFunction) {
  // Check if correlation ID was provided
  const providedId = req.headers['x-correlation-id'] as string
  const correlationId = providedId || crypto.randomUUID()

  req.correlationId = correlationId
  res.setHeader('X-Correlation-ID', correlationId)

  next()
}

/**
 * Get current correlation ID from request
 */
export function getCorrelationId(req: RequestWithCorrelation): string {
  return req.correlationId || 'unknown'
}

/**
 * Log with correlation ID for debugging
 */
export function logWithCorrelation(correlationId: string, level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${correlationId}] [${level}]`

  if (data) {
    console.log(`${prefix} ${message}`, data)
  } else {
    console.log(`${prefix} ${message}`)
  }
}
