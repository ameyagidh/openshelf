import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

/**
 * Reads every committed `search_*.json` fixture (real Open Library API
 * responses, captured at build time — see docs/DECISIONS.md) and normalizes
 * their `docs[]` entries into Book-shaped objects, deduped by work key.
 */
export async function loadBooksFromFixtures() {
  const files = (await readdir(FIXTURES_DIR)).filter((f) => f.startsWith('search_') && f.endsWith('.json'));
  const byKey = new Map();

  for (const file of files) {
    const raw = await readFile(path.join(FIXTURES_DIR, file), 'utf-8');
    const { docs } = JSON.parse(raw);
    for (const doc of docs) {
      if (!doc.key || !doc.title) continue;
      if (byKey.has(doc.key)) continue;
      byKey.set(doc.key, {
        openLibraryKey: doc.key,
        title: doc.title,
        authorNames: doc.author_name ?? [],
        firstPublishYear: doc.first_publish_year,
        coverId: doc.cover_i,
        subjects: (doc.subject ?? []).slice(0, 15),
        editionCount: doc.edition_count ?? 0,
        ratingsAverage: doc.ratings_average,
        isbn: (doc.isbn ?? []).slice(0, 3),
        language: doc.language ?? [],
      });
    }
  }

  return [...byKey.values()];
}
