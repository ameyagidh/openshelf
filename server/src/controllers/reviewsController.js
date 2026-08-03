import { z } from 'zod';
import { Review } from '../models/Review.js';
import { Book } from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { recordActivity } from '../services/activityService.js';

const upsertSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().default(''),
});

export const upsertReview = asyncHandler(async (req, res) => {
  const { bookId, rating, text } = upsertSchema.parse(req.body);

  const book = await Book.findById(bookId);
  if (!book) throw ApiError.notFound('Book not found');

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, book: bookId },
    { rating, text },
    { new: true, upsert: true }
  ).populate('user', 'name avatarUrl');

  await recordActivity({ actor: req.user._id, type: 'reviewed', book: bookId, rating });

  res.status(201).json({ review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  // Ownership check: a user may only delete their own review, regardless of
  // which review id is passed — this is not enforced by the route/auth layer,
  // it's a query-level check (findOneAndDelete scoped to req.user._id).
  const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  res.status(204).send();
});

export const myReviewForBook = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ user: req.user._id, book: req.params.bookId });
  res.json({ review });
});
