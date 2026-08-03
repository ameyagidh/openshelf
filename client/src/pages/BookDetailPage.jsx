import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

function coverUrl(coverId, size = 'L') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

export default function BookDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then((r) => r.data),
  });

  const myReviewQuery = useQuery({
    queryKey: ['myReview', id],
    queryFn: () =>
      api
        .get(`/reviews/mine/${id}`)
        .then((r) => r.data.review)
        .catch(() => null),
    onSuccess: (review) => {
      if (review) {
        setRating(review.rating);
        setText(review.text);
      }
    },
  });

  // Optimistic shelf update: the star buttons feel instant because the local
  // "which shelf is this book on" state flips before the request resolves,
  // and rolls back automatically if the request fails.
  const shelfMutation = useMutation({
    mutationFn: (status) => api.post('/shelf', { bookId: id, status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['book', id] });
      const previous = queryClient.getQueryData(['book', id]);
      queryClient.setQueryData(['book', id], (old) =>
        old ? { ...old, book: { ...old.book, myShelfStatus: status } } : old
      );
      return { previous };
    },
    onError: (_err, _status, context) => {
      if (context?.previous) queryClient.setQueryData(['book', id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['book', id] }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/reviews', { bookId: id, rating: Number(rating), text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['myReview', id] });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Could not save review'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['myReview', id] });
      setText('');
    },
  });

  if (bookQuery.isLoading) return <div className="p-6 text-stone-500">Loading…</div>;
  if (bookQuery.isError) return <div className="p-6 text-red-600">Could not load this book.</div>;

  const { book, reviews, recommendations } = bookQuery.data;
  const myReview = myReviewQuery.data;
  const cover = coverUrl(book.coverId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-64 w-44 flex-shrink-0 overflow-hidden rounded-lg bg-stone-200">
          {cover ? (
            <img src={cover} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">No cover</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900" data-testid="book-title">
            {book.title}
          </h1>
          <p className="mt-1 text-stone-600">{book.authorNames?.join(', ')}</p>
          {book.firstPublishYear && <p className="mt-1 text-sm text-stone-400">First published {book.firstPublishYear}</p>}
          <div className="mt-4 flex gap-2">
            {['want', 'reading', 'read'].map((status) => (
              <button
                key={status}
                className={book.myShelfStatus === status ? 'chip-active' : 'btn-secondary capitalize'}
                onClick={() => shelfMutation.mutate(status)}
              >
                {status === 'want' ? 'Want to read' : status}
              </button>
            ))}
          </div>
          {book.subjects?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {book.subjects.slice(0, 6).map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">{myReview ? 'Update your review' : 'Write a review'}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reviewMutation.mutate();
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="rating" className="text-sm text-stone-500">
              Rating
            </label>
            <select id="rating" className="input w-24" value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="What did you think?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">
              {myReview ? 'Update review' : 'Post review'}
            </button>
            {myReview && (
              <button type="button" className="btn-secondary" onClick={() => deleteReviewMutation.mutate(myReview._id)}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Reviews ({reviews.length})</h2>
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="card">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">{r.user?.name}</span>
                <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
              </div>
              {r.text && <p className="mt-1 text-sm text-stone-600">{r.text}</p>}
            </li>
          ))}
        </ul>
      </div>

      {recommendations.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Readers also shelved</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recommendations.map((rec) => (
              <Link key={rec._id} to={`/books/${rec._id}`} className="card">
                <p className="line-clamp-2 text-sm font-medium text-stone-900">{rec.title}</p>
                <p className="mt-1 text-xs text-stone-500">{rec.coShelvedCount} readers</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
