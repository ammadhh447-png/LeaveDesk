import mongoose from 'mongoose';
import { LEAVE_TYPES } from '../config/constants.js';

const leavePolicySchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      enum: Object.values(LEAVE_TYPES),
      required: true,
      unique: true,
    },
    days: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export const LeavePolicy = mongoose.model('LeavePolicy', leavePolicySchema);
