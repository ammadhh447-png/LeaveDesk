import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, toObjectIdOrNull } from '../utils/helpers.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { env } from '../config/env.js';
import { createSession, revokeSession, refreshSession } from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

const clearAuthCookie = (res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
};

const resolveDepartment = async (department) => {
  if (!department?.trim()) return null;

  const departmentName = department.trim();

  if (department.match(/^[0-9a-fA-F]{24}$/)) {
    const deptExists = await Department.findById(department);
    if (!deptExists) throw new AppError('Department does not exist.');
    return department;
  }

  let dept = await Department.findOne({
    name: { $regex: new RegExp(`^${departmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });

  if (!dept) {
    dept = await Department.create({ name: departmentName });
  }

  return dept._id;
};

export const signup = async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  if (!name || !email || !password || !department?.trim() || !phone?.trim()) {
    throw new AppError('Name, email, password, department, and phone are required.');
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('Email already registered.');
  }

  const departmentId = await resolveDepartment(department);

  const user = await User.create({
    name,
    email,
    password,
    department: departmentId,
    phone: phone.trim(),
    role: ROLES.EMPLOYEE,
    status: USER_STATUS.PENDING,
  });

  successResponse(
    res,
    { user: user.toSafeObject() },
    'Your account approval is pending. A manager will review your registration shortly.',
    201
  );
};

export const signupManager = async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  if (!name || !email || !password || !phone?.trim()) {
    throw new AppError('Name, email, password, and phone are required.');
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('Email already registered.');
  }

  const departmentId = department?.trim() ? await resolveDepartment(department) : null;

  const user = await User.create({
    name,
    email,
    password,
    department: departmentId,
    phone: phone.trim(),
    role: ROLES.MANAGER,
    status: USER_STATUS.PENDING,
  });

  successResponse(
    res,
    { user: user.toSafeObject() },
    'Your account approval is pending. An admin will review your registration shortly.',
    201
  );
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new AppError('This account has been deactivated.', 403);
  }

  if (user.role !== ROLES.ADMIN) {
    if (role === 'employee' && user.role === ROLES.MANAGER) {
      throw new AppError('Manager account detected. Switch to the Manager tab to sign in.', 403);
    }

    if (role === 'manager' && user.role === ROLES.EMPLOYEE) {
      throw new AppError('Employee account detected. Switch to the Employee tab to sign in.', 403);
    }
  }

  if (user.status === USER_STATUS.PENDING) {
    const message = user.role === ROLES.MANAGER
      ? 'Account pending approval from admin.'
      : 'Account pending approval from manager.';
    throw new AppError(message, 403);
  }

  const { token } = await createSession(user, req);
  setAuthCookie(res, token);

  const populated = await User.findById(user._id)
    .populate('department', 'name')
    .populate('manager', 'name email');

  successResponse(res, { user: populated }, 'Signed in successfully.');
};

export const logout = async (req, res) => {
  if (req.sessionJti) {
    await revokeSession(req.sessionJti);
  }
  clearAuthCookie(res);
  successResponse(res, null, 'Logged out successfully.');
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name')
    .populate('manager', 'name email');

  successResponse(res, { user, authenticated: true });
};

export const verifySession = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name')
    .populate('manager', 'name email');

  successResponse(res, { user, authenticated: true, valid: true });
};

export const refreshToken = async (req, res) => {
  const { token } = await refreshSession(req.user, req.sessionJti, req);
  setAuthCookie(res, token);

  const user = await User.findById(req.user._id)
    .populate('department', 'name')
    .populate('manager', 'name email');

  successResponse(res, { user, authenticated: true }, 'Session refreshed.');
};
