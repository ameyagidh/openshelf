import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { ShelfEntry } from '../models/ShelfEntry.js';
import { Review } from '../models/Review.js';
import { Follow } from '../models/Follow.js';
import { Activity } from '../models/Activity.js';
import { loadBooksFromFixtures } from './importBooks.js';
import { logger } from '../utils/logger.js';

const REVIEW_TEXTS = [
  'Could not put this down — read it in a weekend.',
  'A slow start but the back half is fantastic.',
  "Not my favorite, but I can see why people love it.",
  'Reread this for the third time and it still holds up.',
  'The prose alone is worth the price of admission.',
];

async function seed() {
  await connectDb();

  logger.info('Clearing existing collections');
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    ShelfEntry.deleteMany({}),
    Review.deleteMany({}),
    Follow.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  logger.info('Importing books from committed Open Library fixtures');
  const bookDocs = await loadBooksFromFixtures();
  const books = await Book.insertMany(bookDocs);
  logger.info(`Imported ${books.length} books`);

  logger.info('Creating admin and demo users');
  await User.create({
    email: env.seedAdmin.email,
    passwordHash: await User.hashPassword(env.seedAdmin.password),
    name: 'Portfolio Admin',
    role: 'admin',
    bio: 'Keeping the shelves tidy.',
  });

  const demoUsers = await User.insertMany([
    {
      email: 'demo@openshelf.dev',
      passwordHash: await User.hashPassword('Demo1234!'),
      name: 'Demo Reader',
      bio: 'Fantasy and sci-fi, mostly. Always behind on my to-read pile.',
    },
    {
      email: 'maya@openshelf.dev',
      passwordHash: await User.hashPassword('Demo1234!'),
      name: 'Maya Chen',
      bio: 'Mystery and history buff.',
    },
    {
      email: 'sam@openshelf.dev',
      passwordHash: await User.hashPassword('Demo1234!'),
      name: 'Sam Okafor',
      bio: 'Poetry in the morning, biographies at night.',
    },
  ]);
  const [demoUser, maya, sam] = demoUsers;

  logger.info('Building shelves, reviews, follows, and activity for demo richness');

  const shelfStatuses = ['want', 'reading', 'read'];
  const allUsers = [demoUser, maya, sam];
  const shelfEntries = [];
  const reviews = [];
  const activities = [];

  // Give each demo user a shelf spanning ~15 books with overlap, so the
  // "readers also shelved" aggregation has real co-occurrence to find.
  // Skip decision cycles mod 5, status assignment cycles mod 3 (shelfStatuses.length).
  // Using coprime moduli for the two decisions is deliberate: any pair of
  // linear hashes taken mod 3 are multiples of the same residue class and
  // silently alias with each other (verified by hand — an earlier version
  // of this used two "independent-looking" mod-3 hashes that were actually
  // perfectly correlated, and left the primary demo account with zero
  // "read" books). Mod 5 vs. mod 3 can't alias: they agree on a shared
  // pattern only every lcm(3,5) = 15 books, which is enough spread here.
  books.slice(0, 40).forEach((book, i) => {
    allUsers.forEach((user, uIdx) => {
      if ((i + uIdx * 2) % 5 === 4) return; // skip ~1/5 so shelves overlap but aren't identical

      const status = shelfStatuses[(i + uIdx) % shelfStatuses.length];
      shelfEntries.push({ user: user._id, book: book._id, status });
      activities.push({ actor: user._id, type: 'shelved', book: book._id, status, createdAt: new Date(Date.now() - i * 60000) });

      if (status === 'read' && (i + uIdx) % 2 === 0) {
        const rating = 3 + ((i + uIdx) % 3);
        const text = REVIEW_TEXTS[(i + uIdx) % REVIEW_TEXTS.length];
        reviews.push({ user: user._id, book: book._id, rating, text });
        activities.push({ actor: user._id, type: 'reviewed', book: book._id, rating, createdAt: new Date(Date.now() - i * 45000) });
      }
    });
  });

  await ShelfEntry.insertMany(shelfEntries, { ordered: false }).catch(() => {});
  await Review.insertMany(reviews, { ordered: false }).catch(() => {});

  const follows = [
    { follower: demoUser._id, followee: maya._id },
    { follower: demoUser._id, followee: sam._id },
    { follower: maya._id, followee: sam._id },
  ];
  await Follow.insertMany(follows);
  follows.forEach((f) => activities.push({ actor: f.follower, type: 'followed', targetUser: f.followee }));

  await Activity.insertMany(activities);

  logger.info('Seed complete', {
    admin: env.seedAdmin.email,
    demoUsers: allUsers.map((u) => u.email),
    books: books.length,
    shelfEntries: shelfEntries.length,
    reviews: reviews.length,
  });

  await disconnectDb();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed', { message: err.message, stack: err.stack });
  process.exit(1);
});
