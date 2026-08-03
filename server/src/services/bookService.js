import { Book } from '../models/Book.js';
import { ShelfEntry } from '../models/ShelfEntry.js';

const PAGE_SIZE = 12;

/**
 * Faceted, cursor-paginated book search over the locally-cached catalog.
 * Cursor pagination (vs. offset/skip) is used because `skip` degrades
 * linearly as the offset grows — irrelevant at seed-data scale, but the
 * right default for a catalog that's meant to grow unbounded.
 *
 * Sorting is always by `_id` descending (insertion order) rather than by
 * `$text` relevance score, so the cursor (`{ _id: { $lt: cursor } }`) stays
 * simple and stable across pages. A full relevance-ranked search would need
 * a compound (score, _id) cursor — a reasonable next step, documented in
 * docs/DECISIONS.md.
 */
export async function searchBooks({ q, subject, year, cursor, limit = PAGE_SIZE }) {
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (subject) filter.subjects = subject;
  if (year) filter.firstPublishYear = Number(year);
  if (cursor) filter._id = { $lt: cursor };

  const docs = await Book.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  return {
    books: page,
    nextCursor: hasMore ? page[page.length - 1]._id.toString() : null,
  };
}

/** Distinct subjects across the catalog, for the facet filter UI. */
export async function listTopSubjects(limit = 20) {
  const results = await Book.aggregate([
    { $unwind: '$subjects' },
    { $group: { _id: '$subjects', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return results.map((r) => ({ subject: r._id, count: r.count }));
}

/**
 * "Readers also shelved" — an item-based collaborative filter via a single
 * aggregation pipeline: find everyone who shelved this book, then find the
 * other books those same people shelved, ranked by how many of them did.
 */
export async function recommendationsFor(bookId, limit = 6) {
  const results = await ShelfEntry.aggregate([
    { $match: { book: bookId } },
    { $project: { user: 1 } },
    {
      $lookup: {
        from: 'shelfentries',
        localField: 'user',
        foreignField: 'user',
        as: 'otherShelves',
      },
    },
    { $unwind: '$otherShelves' },
    { $match: { $expr: { $ne: ['$otherShelves.book', bookId] } } },
    { $group: { _id: '$otherShelves.book', coShelvedCount: { $sum: 1 } } },
    { $sort: { coShelvedCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book',
      },
    },
    { $unwind: '$book' },
    { $replaceWith: { $mergeObjects: ['$book', { coShelvedCount: '$coShelvedCount' }] } },
  ]);

  return results;
}
