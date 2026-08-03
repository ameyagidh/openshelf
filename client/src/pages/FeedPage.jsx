import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

function describe(activity) {
  switch (activity.type) {
    case 'shelved':
      return (
        <>
          shelved <strong>{activity.book?.title}</strong> as <em>{activity.status}</em>
        </>
      );
    case 'reviewed':
      return (
        <>
          rated <strong>{activity.book?.title}</strong> {'★'.repeat(activity.rating)}
        </>
      );
    case 'followed':
      return (
        <>
          followed <strong>{activity.targetUser?.name}</strong>
        </>
      );
    default:
      return 'did something';
  }
}

export default function FeedPage() {
  const [scope, setScope] = useState('global');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/activity/feed', { params: { scope } }).then(({ data }) => {
      setActivities(data.activities);
      setLoading(false);
    });
  }, [scope]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex gap-2">
        <button className={scope === 'global' ? 'chip-active' : 'chip'} onClick={() => setScope('global')}>
          Everyone
        </button>
        <button className={scope === 'following' ? 'chip-active' : 'chip'} onClick={() => setScope('following')}>
          Following
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading feed…</p>
      ) : activities.length === 0 ? (
        <p className="text-stone-500">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a._id} className="card text-sm">
              <Link to={`/profile/${a.actor._id}`} className="font-medium text-stone-900 hover:underline">
                {a.actor.name}
              </Link>{' '}
              {describe(a)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
