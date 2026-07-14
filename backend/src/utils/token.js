import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export const createJti = () => crypto.randomUUID();

export const generateToken = (userId, role, jti) => {
  return jwt.sign(
    { id: userId, role, jti },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: 'employee-leave-portal',
      audience: 'employee-leave-portal-client',
    }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret, {
      issuer: 'employee-leave-portal',
      audience: 'employee-leave-portal-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    throw new AppError('Invalid session. Please log in again.', 401);
  }
};

export const getTokenExpiryDate = () => {
  const match = env.jwtExpiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * multipliers[unit]);
};
