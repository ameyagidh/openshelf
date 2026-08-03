import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">📚 openshelf</h1>
          <p className="mt-1 text-sm text-stone-500">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-stone-500">
              Name
            </label>
            <input id="name" className="input" value={form.name} onChange={update('name')} required />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-stone-500">
              Email
            </label>
            <input id="email" className="input" type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-stone-500">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              minLength={8}
              value={form.password}
              onChange={update('password')}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have one?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
