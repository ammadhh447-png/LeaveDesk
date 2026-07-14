import { Holiday } from '../models/Holiday.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, getPagination, buildPaginationMeta } from '../utils/helpers.js';
import { createBulkNotifications } from '../services/notification.service.js';

export const getHolidays = async (req, res) => {
  const filter = {};
  if (req.query.upcoming === 'true') {
    filter.date = { $gte: new Date() };
  }

  if (req.query.all === 'true') {
    const holidays = await Holiday.find(filter).sort({ date: 1 });
    return successResponse(res, { holidays });
  }

  const { page, limit, skip } = getPagination(req.query);

  const [holidays, total] = await Promise.all([
    Holiday.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
    Holiday.countDocuments(filter),
  ]);

  successResponse(res, {
    holidays,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const createHoliday = async (req, res) => {
  const { name, date, description } = req.body;
  if (!name || !date) throw new AppError('Holiday name and date are required.');

  const holiday = await Holiday.create({ name, date, description });

  const users = await User.find({ status: 'active' }).select('_id');
  const notifications = users.map((u) => ({
    user: u._id,
    title: 'Holiday Added',
    message: `${name} on ${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} has been added.`,
    type: 'holiday',
    relatedId: holiday._id,
  }));
  await createBulkNotifications(notifications);

  successResponse(res, { holiday }, 'Holiday created.', 201);
};

export const updateHoliday = async (req, res) => {
  const holiday = await Holiday.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!holiday) throw new AppError('Holiday not found.', 404);
  successResponse(res, { holiday }, 'Holiday updated.');
};

export const deleteHoliday = async (req, res) => {
  const holiday = await Holiday.findByIdAndDelete(req.params.id);
  if (!holiday) throw new AppError('Holiday not found.', 404);
  successResponse(res, null, 'Holiday deleted.');
};
