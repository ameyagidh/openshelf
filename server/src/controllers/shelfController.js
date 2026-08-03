import { z } from 'zod';
import { ShelfEntry } from '../models/ShelfEntry.js';
import { Book } from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { recordActivity } from '../services/activityService.js';

const upsertSchema = z.object({
  bookId: z.string().min(1),
  status: z.enum(['want', 'reading', 'read']),
});

export const myShelves = asyncHandler(async (req, res) => {
  const entries = await ShelfEntry.find({ user: req.user._id })
    .populate('book')
    .sort({ updatedAt: -1 })
    .lean();

  const byStatus = { want: [], reading: [], read: [] };
  for (const entry of entries) byStatus[entry.status].push(entry);
  res.json(byStatus);
});

export const upsertShelfEntry = asyncHandler(async (req, res) => {
  const { bookId, status } = upsertSchema.parse(req.body);

  const book = await Book.findById(bookId);
  if (!book) throw ApiError.notFound('Book not found');

  const entry = await ShelfEntry.findOneAndUpdate(
    { user: req.user._id, book: bookId },
    { status },
    { new: true, upsert: true }
  ).populate('book');

  await recordActivity({ actor: req.user._id, type: 'shelved', book: bookId, status });

  res.status(201).json({ entry });
});

export const removeShelfEntry = asyncHandler(async (req, res) => {
  const entry = await ShelfEntry.findOneAndDelete({ user: req.user._id, book: req.params.bookId });
  if (!entry) throw ApiError.notFound('Shelf entry not found');
  res.status(204).send();
});
