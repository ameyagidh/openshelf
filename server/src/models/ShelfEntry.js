import mongoose from 'mongoose';

const shelfEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: { type: String, enum: ['want', 'reading', 'read'], default: 'want' },
  },
  { timestamps: true }
);

// One shelf entry per (user, book) — moving shelves updates status in place.
shelfEntrySchema.index({ user: 1, book: 1 }, { unique: true });
shelfEntrySchema.index({ user: 1, status: 1 });

export const ShelfEntry = mongoose.model('ShelfEntry', shelfEntrySchema);
