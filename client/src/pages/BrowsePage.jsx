import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import BookCard from '../components/BookCard.jsx';

export default function BrowsePage() {
  const [query, setQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    api.get('/books/subjects').then(({ data }) => setSubjects(data.subjects));
  }, []);

  async function runSearch(reset = true) {
    if (reset) setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (activeSubject) params.subject = activeSubject;
    if (!reset && cursor) params.cursor = cursor;

    const { data } = await api.get('/books', { params });
    setBooks((prev) => (reset ? data.books : [...prev, ...data.books]));
    setCursor(data.nextCursor);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject]);

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(true);
  }

  async function loadMore() {
    setLoadingMore(true);
    await runSearch(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input"
          placeholder="Search by title, author, or subject…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary" type="submit">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button className={activeSubject === null ? 'chip-active' : 'chip'} onClick={() => setActiveSubject(null)}>
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s.subject}
            className={activeSubject === s.subject ? 'chip-active' : 'chip'}
            onClick={() => setActiveSubject(s.subject)}
          >
            {s.subject} ({s.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">Loading books…</p>
      ) : books.length === 0 ? (
        <p className="text-stone-500">No books match that search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
          {cursor && (
            <div className="text-center">
              <button className="btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
