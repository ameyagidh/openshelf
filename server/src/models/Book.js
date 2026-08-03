import mongoose from 'mongoose';

/**
 * A local cache of an Open Library "work" — enough fields to render search
 * results, a detail page, and to power aggregation-based recommendations,
 * without re-fetching Open Library on every request.
 */
const bookSchema = new mongoose.Schema(
  {
    openLibraryKey: { type: String, required: true, unique: true }, // e.g. "/works/OL27448W"
    title: { type: String, required: true },
    authorNames: { type: [String], default: [] },
    firstPublishYear: { type: Number },
    coverId: { type: Number },
    subjects: { type: [String], default: [] },
    editionCount: { type: Number, default: 0 },
    ratingsAverage: { type: Number },
    isbn: { type: [String], default: [] },
    language: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Text index across the fields readers actually search by. MongoDB's text
// index reserves a "language" field by default to pick a per-document
// stemming language — but our schema already has its own `language` field
// (ISO codes from Open Library), so `language_override` points it at an
// unused field name instead of colliding with ours.
bookSchema.index(
  { title: 'text', authorNames: 'text', subjects: 'text' },
  { language_override: 'textIndexLanguage' }
);
bookSchema.index({ subjects: 1 });
bookSchema.index({ firstPublishYear: 1 });

bookSchema.methods.coverUrl = function coverUrl(size = 'M') {
  return this.coverId ? `https://covers.openlibrary.org/b/id/${this.coverId}-${size}.jpg` : null;
};

export const Book = mongoose.model('Book', bookSchema);
