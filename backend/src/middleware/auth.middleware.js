import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { validateSession } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/helpers.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    throw new AppError('Not authorized. Please log in.', 401);
  }

  const decoded = verifyToken(token);

  const sessionValid = await validateSession(decoded.jti, decoded.id);
  if (!sessionValid) {
    throw new AppError('Session expired or revoked. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new AppError('User no longer exists.', 401);
  }

  if (user.status === 'inactive') {
    throw new AppError('Your account has been deactivated.', 403);
  }

  req.user = user;
  req.sessionJti = decoded.jti;
  next();
});

export const requireActive = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.status !== 'active') {
    const message = req.user.role === 'manager'
      ? 'Your manager account is pending admin approval.'
      : 'Your account is pending approval.';
    throw new AppError(message, 403);
  }
  next();
});
