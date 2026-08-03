import { loadBooksFromFixtures } from '../../src/seed/importBooks.js';

describe('loadBooksFromFixtures', () => {
  it('loads a non-trivial number of real, deduped books from the committed fixtures', async () => {
    const books = await loadBooksFromFixtures();
    expect(books.length).toBeGreaterThan(50);

    const keys = books.map((b) => b.openLibraryKey);
    expect(new Set(keys).size).toBe(keys.length); // no duplicates across genre fixture files

    for (const book of books) {
      expect(book.openLibraryKey).toMatch(/^\/works\//);
      expect(typeof book.title).toBe('string');
      expect(book.title.length).toBeGreaterThan(0);
    }
  });
});
