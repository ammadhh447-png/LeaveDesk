import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, calculateLeaveDays, getPagination, buildPaginationMeta } from '../utils/helpers.js';
import { LEAVE_STATUS, LEAVE_TYPES, ROLES } from '../config/constants.js';
import { createNotification } from '../services/notification.service.js';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_CATEGORIES,
  logActivity,
} from '../services/activity.service.js';
import { storeUploadedFile } from '../services/storage.service.js';

export const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason?.trim()) {
    throw new AppError('Leave type, start date, end date, and reason are required.');
  }

  if (reason.trim().length < 5) {
    throw new AppError('Reason must be at least 5 characters.');
  }

  if (!Object.values(LEAVE_TYPES).includes(leaveType)) {
    throw new AppError('Invalid leave type.');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    throw new AppError('End date must be after start date.');
  }

  const days = calculateLeaveDays(start, end);
  const user = await User.findById(req.user._id);

  if (leaveType !== LEAVE_TYPES.WFH && user.leaveBalances[leaveType] < days) {
    throw new AppError(`Insufficient ${leaveType.replace('_', ' ')} leave balance.`);
  }

  let attachment;
  if (req.file) {
    const stored = await storeUploadedFile(req.file, `attachments/${req.user._id}`);
    attachment = stored.url;
  }

  const leaveRequest = await LeaveRequest.create({
    employee: req.user._id,
    leaveType,
    startDate: start,
    endDate: end,
    days,
    reason: reason.trim(),
    attachment,
  });

  const populated = await LeaveRequest.findById(leaveRequest._id).populate('employee', 'name email department');

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.LEAVE_APPLIED,
    category: ACTIVITY_CATEGORIES.LEAVE,
    title: 'Leave Request Submitted',
    message: `Submitted ${leaveType.replace('_', ' ')} leave for ${days} day${days > 1 ? 's' : ''}.`,
    relatedModel: 'LeaveRequest',
    relatedId: leaveRequest._id,
    metadata: { leaveType, days, startDate: start, endDate: end, status: 'pending' },
  });

  successResponse(res, { leaveRequest: populated }, 'Leave request submitted successfully.', 201);
};

export const getMyLeaves = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, leaveType, search } = req.query;
  const filter = { employee: req.user._id };

  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;
  if (search?.trim()) {
    const term = search.trim();
    filter.$or = [
      { reason: { $regex: term, $options: 'i' } },
      { leaveType: { $regex: term.replace(/\s+/g, '_'), $options: 'i' } },
    ];
  }

  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate({
        path: 'employee',
        select: 'name email department',
        populate: { path: 'department', select: 'name' },
      })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  successResponse(res, { leaves, pagination: buildPaginationMeta(total, page, limit) });
};

export const getLeaveById = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('employee', 'name email department designation')
    .populate('reviewedBy', 'name');

  if (!leave) throw new AppError('Leave request not found.', 404);

  successResponse(res, { leave });
};

export const getPendingLeaves = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  let employeeIds = [];

  if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, status: 'active' }).select('_id');
    employeeIds = team.map((e) => e._id);
  }

  const filter = { status: LEAVE_STATUS.PENDING };
  if (req.user.role === ROLES.MANAGER) {
    filter.employee = { $in: employeeIds };
  }

  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate({
        path: 'employee',
        select: 'name email department designation',
        populate: { path: 'department', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  successResponse(res, { leaves, pagination: buildPaginationMeta(total, page, limit) });
};

export const getEmployeeLeaveHistory = async (req, res) => {
  const leaves = await LeaveRequest.find({ employee: req.params.employeeId })
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });

  successResponse(res, { leaves });
};

export const reviewLeave = async (req, res) => {
  const { status, reviewNote } = req.body;
  const validStatuses = [LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED, LEAVE_STATUS.INFO_REQUESTED];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status.');
  }

  const leave = await LeaveRequest.findById(req.params.id).populate('employee');
  if (!leave) throw new AppError('Leave request not found.', 404);

  if (leave.status !== LEAVE_STATUS.PENDING && leave.status !== LEAVE_STATUS.INFO_REQUESTED) {
    throw new AppError('This leave request has already been reviewed.');
  }

  if (req.user.role === ROLES.MANAGER) {
    const employee = await User.findById(leave.employee._id);
    if (employee.manager?.toString() !== req.user._id.toString()) {
      throw new AppError('You can only review leaves of your team members.', 403);
    }
  }

  if (status === LEAVE_STATUS.APPROVED) {
    const employee = await User.findById(leave.employee._id);
    if (leave.leaveType !== LEAVE_TYPES.WFH) {
      if (employee.leaveBalances[leave.leaveType] < leave.days) {
        throw new AppError('Employee has insufficient leave balance.');
      }
      employee.leaveBalances[leave.leaveType] -= leave.days;
      await employee.save();
    }
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote;
  leave.reviewedAt = new Date();
  await leave.save();

  const notificationMap = {
    approved: { title: 'Leave Approved', message: `Your ${leave.leaveType} leave has been approved.`, type: 'leave_approved' },
    rejected: { title: 'Leave Rejected', message: `Your ${leave.leaveType} leave has been rejected.`, type: 'leave_rejected' },
    info_requested: { title: 'More Information Needed', message: `Manager requested more info for your leave request.`, type: 'leave_info' },
  };

  const notif = notificationMap[status];
  await createNotification({
    userId: leave.employee._id,
    title: notif.title,
    message: reviewNote || notif.message,
    type: notif.type,
    relatedId: leave._id,
  });

  const statusLabel = status.replace('_', ' ');
  await logActivity({
    userId: leave.employee._id,
    action: ACTIVITY_ACTIONS.LEAVE_REVIEWED,
    category: ACTIVITY_CATEGORIES.LEAVE,
    title: `Leave ${statusLabel.charAt(0).toUpperCase()}${statusLabel.slice(1)}`,
    message: `Your ${leave.leaveType.replace('_', ' ')} leave was ${statusLabel} by ${req.user.name}.`,
    relatedModel: 'LeaveRequest',
    relatedId: leave._id,
    metadata: { leaveType: leave.leaveType, status, reviewedBy: req.user.name },
  });

  const updated = await LeaveRequest.findById(leave._id)
    .populate('employee', 'name email department')
    .populate('reviewedBy', 'name');

  successResponse(res, { leave: updated }, `Leave request ${status}.`);
};

export const getTeamCalendar = async (req, res) => {
  let employeeIds = [];

  if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, status: 'active' }).select('_id');
    employeeIds = team.map((e) => e._id);
  } else if (req.user.role === ROLES.ADMIN) {
    const all = await User.find({ role: ROLES.EMPLOYEE, status: 'active' }).select('_id');
    employeeIds = all.map((e) => e._id);
  }

  const leaves = await LeaveRequest.find({
    employee: { $in: employeeIds },
    status: LEAVE_STATUS.APPROVED,
    endDate: { $gte: new Date() },
  })
    .populate('employee', 'name department')
    .sort({ startDate: 1 });

  successResponse(res, { leaves });
};

export const getManagerDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const team = await User.find({ manager: req.user._id, status: 'active' }).select('_id');
  const teamIds = team.map((e) => e._id);

  const [pendingLeaves, approvedToday, rejectedToday, pendingEmployees, recentLeaves] = await Promise.all([
    LeaveRequest.countDocuments({ employee: { $in: teamIds }, status: 'pending' }),
    LeaveRequest.countDocuments({
      employee: { $in: teamIds },
      status: 'approved',
      reviewedAt: { $gte: today, $lt: tomorrow },
    }),
    LeaveRequest.countDocuments({
      employee: { $in: teamIds },
      status: 'rejected',
      reviewedAt: { $gte: today, $lt: tomorrow },
    }),
    User.countDocuments({ manager: req.user._id, status: 'pending' }),
    LeaveRequest.find({ employee: { $in: teamIds } })
      .populate('employee', 'name')
      .sort({ createdAt: -1 })
      .limit(3),
  ]);

  successResponse(res, {
    stats: { pendingLeaves, approvedToday, rejectedToday, pendingEmployees },
    recentLeaves,
  });
};

export const updateLeaveStatus = async (req, res) => {
  return reviewLeave(req, res);
};

const getScopedEmployeeIds = async (user) => {
  if (user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: user._id, status: 'active' }).select('_id');
    return team.map((e) => e._id);
  }
  return null;
};

export const getLeaveHistory = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, leaveType, search, employeeId } = req.query;
  const filter = {};

  if (req.user.role === ROLES.EMPLOYEE) {
    filter.employee = req.user._id;

    if (search?.trim()) {
      const term = search.trim();
      filter.$or = [
        { reason: { $regex: term, $options: 'i' } },
        { leaveType: { $regex: term.replace(/\s+/g, '_'), $options: 'i' } },
      ];
    }
  } else {
    const teamIds = await getScopedEmployeeIds(req.user);
    if (teamIds) filter.employee = { $in: teamIds };

    if (employeeId) filter.employee = employeeId;

    if (search?.trim()) {
      const userFilter = {
        name: { $regex: search.trim(), $options: 'i' },
        role: ROLES.EMPLOYEE,
      };
      if (req.user.role === ROLES.MANAGER) userFilter.manager = req.user._id;
      const users = await User.find(userFilter).select('_id');
      filter.employee = { $in: users.map((u) => u._id) };
    }
  }

  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;

  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate({
        path: 'employee',
        select: 'name email department',
        populate: { path: 'department', select: 'name' },
      })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  successResponse(res, { leaves, pagination: buildPaginationMeta(total, page, limit) });
};

export const updateLeave = async (req, res) => {
  const { status, reason, startDate, endDate, leaveType } = req.body;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError('Leave request not found.', 404);

  if (status) leave.status = status;
  if (reason) leave.reason = reason;
  if (leaveType) leave.leaveType = leaveType;
  if (startDate) leave.startDate = new Date(startDate);
  if (endDate) leave.endDate = new Date(endDate);
  if (startDate || endDate) {
    leave.days = calculateLeaveDays(leave.startDate, leave.endDate);
  }

  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  const updated = await LeaveRequest.findById(leave._id)
    .populate('employee', 'name email department')
    .populate('reviewedBy', 'name');

  successResponse(res, { leave: updated }, 'Leave record updated.');
};

export const deleteLeave = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError('Leave request not found.', 404);

  if (leave.status === LEAVE_STATUS.APPROVED && leave.leaveType !== LEAVE_TYPES.WFH) {
    const employee = await User.findById(leave.employee);
    if (employee) {
      employee.leaveBalances[leave.leaveType] += leave.days;
      await employee.save();
    }
  }

  await leave.deleteOne();
  successResponse(res, null, 'Leave record deleted.');
};
