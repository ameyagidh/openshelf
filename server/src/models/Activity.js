import mongoose from 'mongoose';

/**
 * A denormalized activity log — one document per user action — that powers
 * the "activity feed" via a simple indexed query rather than fanning a write
 * out to every follower's inbox (a reasonable tradeoff at this scale; a
 * fan-out-on-write inbox is the next step if the follower graph got large).
 */
const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['shelved', 'reviewed', 'followed'], required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String }, // for 'shelved': want | reading | read
    rating: { type: Number }, // for 'reviewed'
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
