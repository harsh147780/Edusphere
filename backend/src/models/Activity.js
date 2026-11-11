import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
