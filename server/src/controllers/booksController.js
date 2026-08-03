import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Book } from '../models/Book.js';
import { Review } from '../models/Review.js';
import { ShelfEntry } from '../models/ShelfEntry.js';
import { searchBooks, listTopSubjects, recommendationsFor } from '../services/bookService.js';

export const search = asyncHandler(async (req, res) => {
  const { q, subject, year, cursor, limit } = req.query;
  const result = await searchBooks({ q, subject, year, cursor, limit: limit ? Number(limit) : undefined });
  res.json(result);
});

export const subjects = asyncHandler(async (req, res) => {
  res.json({ subjects: await listTopSubjects() });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).lean();
  if (!book) throw ApiError.notFound('Book not found');

  const [reviews, recommendations, myShelfEntry] = await Promise.all([
    Review.find({ book: book._id }).populate('user', 'name avatarUrl').sort({ createdAt: -1 }).lean(),
    recommendationsFor(book._id),
    ShelfEntry.findOne({ user: req.user._id, book: book._id }).lean(),
  ]);

  res.json({
    book: { ...book, myShelfStatus: myShelfEntry?.status ?? null },
    reviews,
    recommendations,
  });
});
