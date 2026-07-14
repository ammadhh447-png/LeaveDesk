import { User } from '../models/User.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Holiday } from '../models/Holiday.js';
import { Announcement } from '../models/Announcement.js';
import { Department } from '../models/Department.js';
import { LeavePolicy } from '../models/LeavePolicy.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, toObjectIdOrNull, getPagination, buildPaginationMeta } from '../utils/helpers.js';
import { ROLES } from '../config/constants.js';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_CATEGORIES,
  buildProfileChanges,
  logActivity,
  notifyProfileChangeStakeholders,
} from '../services/activity.service.js';
import { storeUploadedFile, deleteStoredFile } from '../services/storage.service.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildLeaveTrend = async (userId, year) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const stats = await LeaveRequest.aggregate([
    {
      $match: {
        employee: userId,
        createdAt: { $gte: start, $lt: end },
        status: { $in: ['approved', 'pending', 'rejected'] },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  return MONTH_LABELS.map((month, index) => {
    const monthNum = index + 1;
    const monthStats = stats.filter((s) => s._id.month === monthNum);
    const getCount = (status) => monthStats.find((s) => s._id.status === status)?.count || 0;
    return {
      month,
      approved: getCount('approved'),
      pending: getCount('pending'),
      rejected: getCount('rejected'),
    };
  });
};

const resolveDepartmentId = async (department) => {
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

export const getDashboard = async (req, res) => {
  const userId = req.user._id;

  const [
    user,
    pendingRequests,
    upcomingHolidays,
    announcements,
    recentLeaves,
    recentActivities,
    policies,
  ] = await Promise.all([
    User.findById(userId).populate('department', 'name'),
    LeaveRequest.countDocuments({ employee: userId, status: 'pending' }),
    Holiday.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
    Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(3).populate('createdBy', 'name'),
    LeaveRequest.find({ employee: userId }).sort({ createdAt: -1 }).limit(3),
    ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).limit(4),
    LeavePolicy.find().select('leaveType days'),
  ]);

  const approvedLeaves = await LeaveRequest.find({
    employee: userId,
    status: 'approved',
  });

  const leavesTaken = approvedLeaves.reduce((sum, leave) => sum + leave.days, 0);
  const leaveBalances = user?.leaveBalances || {};
  const totalBalance = Object.values(leaveBalances).reduce((sum, val) => sum + val, 0);

  const policyTotals = policies.reduce((acc, policy) => {
    acc[policy.leaveType] = policy.days;
    return acc;
  }, {});

  successResponse(res, {
    user,
    stats: {
      totalBalance,
      leavesTaken,
      pendingRequests,
      leaveBalances,
      policyTotals,
    },
    upcomingHolidays,
    announcements,
    recentLeaves,
    recentActivities,
  });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name')
    .populate('manager', 'name email');

  successResponse(res, { user });
};

export const updateProfile = async (req, res) => {
  const before = await User.findById(req.user._id).populate('department', 'name');
  if (!before) throw new AppError('User not found.', 404);

  const allowedFields = ['name', 'designation', 'phone', 'address', 'emergencyContact'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.body.department !== undefined) {
    updates.department = toObjectIdOrNull(req.body.department);
  }

  if (req.file) {
    if (before.profilePicture) {
      await deleteStoredFile(before.profilePicture);
    }
    const stored = await storeUploadedFile(req.file, `profiles/${req.user._id}`);
    updates.profilePicture = stored.url;
  }

  if (!Object.keys(updates).length) {
    throw new AppError('No profile changes provided.');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('department', 'name')
    .populate('manager', 'name email');

  const changes = buildProfileChanges(before.toObject(), user.toObject(), updates);

  if (changes.length) {
    const activity = await logActivity({
      userId: req.user._id,
      action: ACTIVITY_ACTIONS.PROFILE_UPDATED,
      category: ACTIVITY_CATEGORIES.PROFILE,
      title: 'Profile Updated',
      message: `Updated ${changes.map((c) => c.label).join(', ')}.`,
      changes,
    });

    if (user.role === ROLES.EMPLOYEE) {
      await notifyProfileChangeStakeholders(
        user,
        activity._id,
        changes.map((c) => c.label).join(', '),
      );
    }
  }

  successResponse(res, { user }, 'Profile updated successfully.');
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required.');
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.');
  }

  const user = await User.findById(req.user._id).select('+password').populate('manager', '_id');
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();

  const activity = await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.PASSWORD_CHANGED,
    category: ACTIVITY_CATEGORIES.SECURITY,
    title: 'Password Changed',
    message: 'Account password was updated successfully.',
    changes: [{ field: 'password', label: 'Password', from: '••••••••', to: 'Updated' }],
  });

  if (user.role === ROLES.EMPLOYEE) {
    await notifyProfileChangeStakeholders(user, activity._id, 'Password');
  }

  successResponse(res, null, 'Password updated successfully.');
};

export const getLeaveBalance = async (req, res) => {
  const user = await User.findById(req.user._id).select('leaveBalances name');
  successResponse(res, { leaveBalances: user.leaveBalances, name: user.name });
};

export const getAllUsers = async (req, res) => {
  const { role, status, department, search, all } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (all === 'true') {
    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
    return successResponse(res, { users });
  }

  const { page, limit, skip } = getPagination(req.query);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('department', 'name')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  successResponse(res, { users, pagination: buildPaginationMeta(total, page, limit) });
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('department', 'name')
    .populate('manager', 'name email');

  if (!user) throw new AppError('User not found.', 404);

  successResponse(res, { user });
};

export const createUser = async (req, res) => {
  const { name, email, password, role, department, designation, phone, manager } = req.body;
  const userRole = role || ROLES.EMPLOYEE;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.');
  }

  if (userRole === ROLES.EMPLOYEE && (!department || !phone)) {
    throw new AppError('Department and phone are required for employees.');
  }

  if (userRole === ROLES.MANAGER && !phone) {
    throw new AppError('Phone is required for managers.');
  }

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already exists.');

  const departmentId = department ? await resolveDepartmentId(department) : null;
  const managerId = toObjectIdOrNull(manager);

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    department: departmentId,
    designation: designation || undefined,
    phone: phone || undefined,
    manager: managerId,
    status: 'active',
  });

  const message = userRole === ROLES.MANAGER
    ? 'Manager created. Share the login credentials with them.'
    : 'User created successfully.';

  successResponse(res, { user: user.toSafeObject(), credentials: { email, password } }, message, 201);
};

export const updateUser = async (req, res) => {
  const { name, email, role, department, designation, phone, manager, status, leaveBalances } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (designation !== undefined) updates.designation = designation;
  if (phone !== undefined) updates.phone = phone;
  if (status) updates.status = status;
  if (leaveBalances) updates.leaveBalances = leaveBalances;

  if (department !== undefined) {
    updates.department = department ? await resolveDepartmentId(department) : null;
  }

  if (manager !== undefined) {
    updates.manager = toObjectIdOrNull(manager);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .select('-password')
    .populate('department', 'name')
    .populate('manager', 'name email');

  if (!user) throw new AppError('User not found.', 404);

  successResponse(res, { user }, 'User updated successfully.');
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  successResponse(res, null, 'User deleted successfully.');
};

export const getPendingEmployees = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;
  const filter = { status: 'pending' };

  if (req.user.role === ROLES.MANAGER) {
    filter.role = ROLES.EMPLOYEE;
    filter.$or = [
      { manager: req.user._id },
      { manager: null },
      { manager: { $exists: false } },
    ];
  }

  if (search?.trim()) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
        ],
      },
    ];
  }

  const [employees, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  successResponse(res, { employees, pagination: buildPaginationMeta(total, page, limit) });
};

export const approveEmployee = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user.role === ROLES.MANAGER && req.user.role !== ROLES.ADMIN) {
    throw new AppError('Only admin can approve manager accounts.', 403);
  }

  if (user.role === ROLES.EMPLOYEE && req.user.role === ROLES.MANAGER) {
    if (user.manager && user.manager.toString() !== req.user._id.toString()) {
      throw new AppError('You can only approve employees assigned to you.', 403);
    }
  }

  user.status = 'active';

  if (!user.manager && req.user.role === ROLES.MANAGER && user.role === ROLES.EMPLOYEE) {
    user.manager = req.user._id;
  }

  await user.save();

  const { createNotification } = await import('../services/notification.service.js');
  await createNotification({
    userId: user._id,
    title: 'Account Approved',
    message: 'Your account has been approved. You can now sign in.',
    type: 'account',
  });

  successResponse(res, { user }, `${user.role} approved successfully.`);
};

export const rejectEmployee = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user.role === ROLES.MANAGER && req.user.role !== ROLES.ADMIN) {
    throw new AppError('Only admin can reject manager accounts.', 403);
  }

  user.status = 'inactive';
  await user.save();

  successResponse(res, { user }, 'Account rejected.');
};

export const getTeamMembers = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;

  const filter = {
    manager: req.user._id,
    status: 'active',
    role: ROLES.EMPLOYEE,
  };

  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [members, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name')
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  successResponse(res, { members, pagination: buildPaginationMeta(total, page, limit) });
};

export const updateNotificationSettings = async (req, res) => {
  const { notificationsEnabled } = req.body;
  if (typeof notificationsEnabled !== 'boolean') {
    throw new AppError('notificationsEnabled must be a boolean.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { notificationsEnabled },
    { new: true }
  ).select('-password');

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.NOTIFICATION_SETTINGS,
    category: ACTIVITY_CATEGORIES.ACCOUNT,
    title: 'Notification Settings Updated',
    message: `Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}.`,
    changes: [{
      field: 'notificationsEnabled',
      label: 'Notifications',
      from: notificationsEnabled ? 'Disabled' : 'Enabled',
      to: notificationsEnabled ? 'Enabled' : 'Disabled',
    }],
  });

  successResponse(res, { user }, 'Notification settings updated.');
};
