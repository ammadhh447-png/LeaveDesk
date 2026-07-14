import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, getPagination, buildPaginationMeta, resolveObjectId } from '../utils/helpers.js';
import { ROLES } from '../config/constants.js';
import { ACTIVITY_CATEGORIES } from '../services/activity.service.js';

const PROFILE_CATEGORIES = [ACTIVITY_CATEGORIES.PROFILE, ACTIVITY_CATEGORIES.SECURITY];

const populateActivity = { path: 'user', select: 'name email role department', populate: { path: 'department', select: 'name' } };

export const getMyActivities = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, category } = req.query;
  const filter = { user: req.user._id };

  if (category) filter.category = category;

  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { message: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  successResponse(res, {
    activities,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const getTeamProfileActivities = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;
  const filter = { category: { $in: PROFILE_CATEGORIES } };

  if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, role: ROLES.EMPLOYEE }).select('_id');
    const teamIds = team.map((member) => member._id);
    filter.user = { $in: teamIds };
  } else if (req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized.', 403);
  } else {
    filter.user = { $ne: req.user._id };
  }

  if (search?.trim()) {
    const users = await User.find({
      name: { $regex: search.trim(), $options: 'i' },
      ...(req.user.role === ROLES.MANAGER ? { manager: req.user._id } : {}),
    }).select('_id');
    filter.user = { $in: users.map((u) => u._id) };
  }

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate(populateActivity)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  successResponse(res, {
    activities,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const getActivityById = async (req, res) => {
  const activity = await ActivityLog.findById(req.params.id).populate(populateActivity);
  if (!activity) throw new AppError('Activity not found.', 404);

  const isOwner = activity.user._id?.toString() === req.user._id.toString()
    || activity.user?.toString?.() === req.user._id.toString();

  if (isOwner) {
    return successResponse(res, { activity });
  }

  if (!PROFILE_CATEGORIES.includes(activity.category)) {
    throw new AppError('Not authorized to view this activity.', 403);
  }

  if (req.user.role === ROLES.ADMIN) {
    return successResponse(res, { activity });
  }

  if (req.user.role === ROLES.MANAGER) {
    const activityUserId = resolveObjectId(activity.user?._id || activity.user);
    if (!activityUserId) throw new AppError('Not authorized to view this activity.', 403);

    const employee = await User.findById(activityUserId).select('manager');
    const employeeManagerId = resolveObjectId(employee?.manager);
    if (employeeManagerId === req.user._id.toString()) {
      return successResponse(res, { activity });
    }
  }

  throw new AppError('Not authorized to view this activity.', 403);
};

const adminProfileFilter = (adminId) => ({
  category: { $in: PROFILE_CATEGORIES },
  user: { $ne: adminId },
});

export const deleteActivity = async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized.', 403);
  }

  const activity = await ActivityLog.findById(req.params.id);
  if (!activity) throw new AppError('Activity not found.', 404);
  if (!PROFILE_CATEGORIES.includes(activity.category)) {
    throw new AppError('Cannot delete this activity.', 403);
  }

  await activity.deleteOne();
  successResponse(res, null, 'Activity deleted.');
};

export const deleteActivities = async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized.', 403);
  }

  const { ids } = req.body;
  if (!ids?.length) {
    throw new AppError('Select at least one activity to delete.');
  }

  const result = await ActivityLog.deleteMany({
    _id: { $in: ids },
    ...adminProfileFilter(req.user._id),
  });

  successResponse(res, { deletedCount: result.deletedCount }, 'Selected activities deleted.');
};

export const deleteAllProfileActivities = async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized.', 403);
  }

  const result = await ActivityLog.deleteMany(adminProfileFilter(req.user._id));
  successResponse(res, { deletedCount: result.deletedCount }, 'All profile activities deleted.');
};
