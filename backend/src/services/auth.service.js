import { Session } from '../models/Session.js';
import { createJti, generateToken, getTokenExpiryDate } from '../utils/token.js';

export const createSession = async (user, req) => {
  const jti = createJti();
  const expiresAt = getTokenExpiryDate();

  await Session.create({
    user: user._id,
    jti,
    expiresAt,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.socket?.remoteAddress || '',
  });

  const token = generateToken(user._id, user.role, jti);

  return { token, jti, expiresAt };
};

export const validateSession = async (jti, userId) => {
  const session = await Session.findOne({
    jti,
    user: userId,
    isValid: true,
    expiresAt: { $gt: new Date() },
  });

  return !!session;
};

export const revokeSession = async (jti) => {
  if (!jti) return;
  await Session.updateOne({ jti }, { isValid: false });
};

export const refreshSession = async (user, oldJti, req) => {
  await revokeSession(oldJti);
  return createSession(user, req);
};
