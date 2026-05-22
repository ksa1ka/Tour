import type { UserRole } from '@prisma/client'

export {}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userRole?: UserRole
    }
  }
}
