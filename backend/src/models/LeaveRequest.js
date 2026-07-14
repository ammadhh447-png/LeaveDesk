import mongoose from 'mongoose';
import { LEAVE_TYPES, LEAVE_STATUS } from '../config/constants.js';

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: Object.values(LEAVE_TYPES),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, minlength: 5 },
    attachment: { type: String },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
