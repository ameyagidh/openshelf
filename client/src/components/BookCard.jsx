import { Link } from 'react-router-dom';

function coverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

export default function BookCard({ book }) {
  const cover = coverUrl(book.coverId);
  return (
    <Link to={`/books/${book._id}`} className="card flex gap-3 hover:shadow-md" data-testid={`book-card-${book._id}`}>
      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-stone-200">
        {cover ? (
          <img src={cover} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone-400">No cover</div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 font-semibold text-stone-900">{book.title}</h3>
        <p className="mt-0.5 text-sm text-stone-500">{book.authorNames?.join(', ') || 'Unknown author'}</p>
        {book.firstPublishYear && <p className="mt-1 text-xs text-stone-400">{book.firstPublishYear}</p>}
        {book.subjects?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.subjects.slice(0, 2).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
