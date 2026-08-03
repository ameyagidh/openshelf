# Design decisions

**Open Library is imported once at seed time, not queried live.** Open Library's search API is
public and keyless, but has no documented SLA and is shared infrastructure — hammering it on every
user keystroke in a search box would be a bad neighbor and a flaky demo. Instead, `npm run seed`
reads committed fixture files (real captured API responses, one per genre) and writes normalized
`Book` documents into MongoDB once. Every subsequent search/filter/recommendation query runs
entirely against the local database. The tradeoff: the catalog is fixed at ~117 books rather than
"all of Open Library" — acceptable for a portfolio project, and the import path
(`src/seed/importBooks.js`) is the one piece that would change to point at a live sync job instead.

**Cursor pagination (`_id`-based), not offset/skip.** `Book.find({...}).skip(n).limit(m)` gets
linearly slower as `n` grows, because MongoDB still has to walk and discard the first `n` documents.
At seed-data scale that's irrelevant; the point is architectural — a catalog that's meant to grow
unbounded should never be built on `skip`. The cursor is deliberately simple: sort by `_id`
descending, cursor = `{ _id: { $lt: lastId } }`. The cost of that simplicity is real: `$text`
matches are used as a filter, not scored/ranked by relevance, since a relevance-ranked cursor would
need a compound `(score, _id)` cursor. For a catalog this size, exact-match-then-recency is a fine
default; a production version would add Atlas Search or a dedicated search engine for ranked
results without giving up cursor pagination.

**Recommendations are a live aggregation pipeline, not a precomputed table.** `recommendationsFor()`
runs a `$lookup`-based item-to-item collaborative filter on every book-detail request: find who
shelved this book, find what else those people shelved, rank by co-occurrence. This is the
right call at this data size (single-digit milliseconds) and is more honest for a portfolio project
than faking a "ML-powered" recommender — it's a real, explainable pipeline. It would need caching
or a scheduled precomputation step before it scaled to millions of shelf entries.

**Activity feed is a denormalized log, not a fan-out-on-write inbox.** Writing one `Activity`
document per action and querying `{ actor: { $in: followees } }` on read is simpler than writing a
copy of every action into every follower's personal inbox at write time. Fan-out-on-write is the
standard answer once a single user's follower count gets large (Twitter-scale), but it's a real
engineering cost (write amplification, inbox storage) that isn't justified here — documented so the
tradeoff is explicit, not accidental.

**Ownership enforced in the query, not the controller.** `Review.findOneAndDelete({ _id, user })`
rather than "fetch the review, check `review.user.equals(req.user._id)`, then delete." The query-level
version is shorter, can't be accidentally skipped in a future edit, and returns a uniform 404
whether the review doesn't exist or belongs to someone else — it never confirms or denies that a
given ID exists for another user, which is a minor but free information-leak reduction.

**Multer avatar uploads go to local disk, not S3/Cloudinary.** For a project that already runs
entirely locally (see pulseboard's Redis/Mongo-via-Docker pattern), adding a cloud storage
dependency just to upload a profile picture would trade a real capability demo (multipart upload
handling, file-type/size validation, static serving) for cloud-vendor plumbing that doesn't teach
anything new. `server/uploads/` is gitignored; swapping the storage engine is a one-file change in
`middleware/upload.js` (multer supports pluggable storage engines for exactly this reason).

**Text index `language_override` is explicitly renamed.** MongoDB text indexes reserve a field
literally named `language` by default, to pick per-document stemming. The `Book` schema already has
its own `language` field (ISO codes from Open Library, e.g. `["eng"]`) — a plain array, not the
string MongoDB expects for that role. Without `language_override: 'textIndexLanguage'` in the index
options, `Book.insertMany()` throws `found language override field in document with non-string type`
on the very first real import. This is the kind of bug that only shows up with real data — the fixed
form should be treated as required whenever a schema's own domain field happens to collide with one
of MongoDB's few reserved text-index field names (`language`, `_fts`, `_ftsx`).
