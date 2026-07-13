'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'internal_error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-mv-light">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-mv-dark">Create an account</h1>
        <p className="mb-6 text-mv-dark/70">Start your family&apos;s MoneyVerse journey.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error === 'auth.duplicate_email' ? 'This email is already registered.' : 'Something went wrong.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mv-dark/20 focus:outline-none focus:ring-2 focus:ring-mv-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mv-dark/20 focus:outline-none focus:ring-2 focus:ring-mv-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link prefetch={false} href="/login" className="text-mv-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
