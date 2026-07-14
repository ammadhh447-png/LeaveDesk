import { LeavePolicy } from '../models/LeavePolicy.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { successResponse } from '../utils/helpers.js';
import { createBulkNotifications } from '../services/notification.service.js';

export const getPolicies = async (req, res) => {
  const policies = await LeavePolicy.find().sort({ leaveType: 1 });
  successResponse(res, { policies });
};

export const createPolicy = async (req, res) => {
  const { leaveType, days, description } = req.body;
  if (!leaveType || days === undefined) throw new AppError('Leave type and days are required.');

  const policy = await LeavePolicy.create({ leaveType, days, description });
  successResponse(res, { policy }, 'Policy created.', 201);
};

export const updatePolicy = async (req, res) => {
  const policy = await LeavePolicy.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!policy) throw new AppError('Policy not found.', 404);

  const users = await User.find({ status: 'active' }).select('_id');
  const notifications = users.map((u) => ({
    user: u._id,
    title: 'Policy Updated',
    message: `${policy.leaveType} leave policy updated to ${policy.days} days.`,
    type: 'policy',
    relatedId: policy._id,
  }));
  await createBulkNotifications(notifications);

  successResponse(res, { policy }, 'Policy updated.');
};

export const deletePolicy = async (req, res) => {
  const policy = await LeavePolicy.findByIdAndDelete(req.params.id);
  if (!policy) throw new AppError('Policy not found.', 404);
  successResponse(res, null, 'Policy deleted.');
};
