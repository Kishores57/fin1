import jwt from 'jsonwebtoken';
import { settings } from '../config.js';

/**
 * Middleware to verify JWT token in Authorization header.
 * Attaches decoded user payload { id, email, role, name, organization } to req.user.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Access token required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, settings.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ detail: 'Invalid authorization token.' });
  }
}

/**
 * Middleware to restrict access to specific roles (e.g. ['admin']).
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `Access denied. Requires one of [${allowedRoles.join(', ')}] role(s).`,
      });
    }
    next();
  };
}

/**
 * Optional token verification: populates req.user if present, but doesn't block if missing.
 */
export function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, settings.JWT_SECRET);
    } catch {
      // Ignore token failure for optional endpoints
    }
  }
  next();
}
