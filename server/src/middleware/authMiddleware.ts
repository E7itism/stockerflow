/**
 * authMiddleware.ts
 *
 * Two middleware functions that protect routes:
 * 1. authenticateToken — verifies the JWT, attaches user to req
 * 2. authorizeRole    — checks if user has the required role
 *
 * Usage in routes:
 *   router.get('/protected', authenticateToken, controller.handler)
 *   router.delete('/admin-only', authenticateToken, authorizeRole('admin'), controller.handler)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Extends Express's built-in Request type to include our custom `user` property.
 *
 * Why use declare global + namespace Express?
 * Express doesn't know about req.user by default.
 * Without this, TypeScript would throw an error every time we write req.user.
 * This "augments" the Express type globally so req.user is recognized everywhere.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * authenticateToken — verifies JWT from the Authorization header.
 *
 * Expected header format:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * Why split(' ')[1]?
 * The header value is "Bearer TOKEN" (two words).
 * split(' ') gives ["Bearer", "TOKEN"]
 * [1] gets just the token part.
 *
 * Why 401 vs 403?
 * 401 = "I don't know who you are" (no/missing token)
 * 403 = "I know who you are but you're not allowed" (invalid/expired token)
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    /**
     * jwt.verify() does two things at once:
     * 1. Checks the signature (was this token signed with our JWT_SECRET?)
     * 2. Checks expiry (has the 7-day window passed?)
     *
     * If either check fails, it throws an error → caught below → 403
     */
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    // Attach decoded user info to request so downstream controllers can use it
    // Controllers access it via: req.user.userId, req.user.role, etc.
    req.user = decoded;

    next(); // Pass to the next middleware or controller
  } catch (error) {
    // jwt.verify threw — token is invalid or expired
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * authorizeRole — checks if the authenticated user has a permitted role.
 *
 * Why a factory function (returns a function)?
 * We need to pass the allowed roles as arguments, but middleware must
 * be a function with (req, res, next) signature. A factory lets us do both:
 *
 *   authorizeRole('admin', 'manager')
 *   → returns (req, res, next) => { ... }
 *
 * Why use ...allowedRoles (rest parameter)?
 * So you can pass one or more roles:
 *   authorizeRole('admin')                  → only admin
 *   authorizeRole('admin', 'manager')       → admin or manager
 *
 * Always use AFTER authenticateToken:
 *   router.delete('/:id', authenticateToken, authorizeRole('admin'), handler)
 */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Should not happen if authenticateToken runs first, but defensive check
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
