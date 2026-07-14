import mongoose from 'mongoose';

const changeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    label: { type: String, required: true },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
  },
  { _id: false },
);

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    changes: [changeSchema],
    relatedModel: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
