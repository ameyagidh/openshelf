import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);

  async function load() {
    const { data } = await api.get(`/users/${id}`);
    setProfile(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleFollow() {
    if (profile.isFollowing) await api.delete(`/users/${id}/follow`);
    else await api.post(`/users/${id}/follow`);
    load();
  }

  if (!profile) return <div className="p-6 text-stone-500">Loading…</div>;

  const isMe = me?.id === id;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {profile.user.avatarUrl ? (
            <img src={profile.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            profile.user.name?.[0]
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-900">{profile.user.name}</h1>
          {profile.user.bio && <p className="text-sm text-stone-500">{profile.user.bio}</p>}
          <p className="mt-1 text-xs text-stone-400">
            {profile.followerCount} followers · {profile.followingCount} following
          </p>
        </div>
        {!isMe && (
          <button className={profile.isFollowing ? 'btn-secondary' : 'btn-primary'} onClick={toggleFollow}>
            {profile.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}
