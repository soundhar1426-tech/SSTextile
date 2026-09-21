import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Middleware: Verify JWT and attach authenticated user to request
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID and attach to req (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or session invalid',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' 
          ? 'Token expired. Please log in again.' 
          : 'Invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }
};

/**
 * Middleware: Enforce admin authorization
 * Rejects any non-admin users with 403 Forbidden
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Admin access required. Forbidden.',
  });
};
