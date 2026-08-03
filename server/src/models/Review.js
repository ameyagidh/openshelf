import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

// One review per user per book — re-reviewing edits the existing one.
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
reviewSchema.index({ book: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
