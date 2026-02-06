import { Request } from 'express'
import { Dealership } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      dealership?: Dealership
      userId?: string
      userRole?: string
    }
  }
}
