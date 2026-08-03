import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import BookCard from '../components/BookCard.jsx';

const LABELS = { want: 'Want to read', reading: 'Reading', read: 'Read' };

export default function ShelvesPage() {
  const [shelves, setShelves] = useState(null);

  useEffect(() => {
    api.get('/shelf').then(({ data }) => setShelves(data));
  }, []);

  if (!shelves) return <div className="p-6 text-stone-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {['reading', 'want', 'read'].map((status) => (
        <section key={status}>
          <h2 className="mb-3 text-lg font-semibold text-stone-900" data-testid={`shelf-${status}`}>
            {LABELS[status]} ({shelves[status].length})
          </h2>
          {shelves[status].length === 0 ? (
            <p className="text-sm text-stone-500">Nothing here yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shelves[status].map((entry) => (
                <BookCard key={entry._id} book={entry.book} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
