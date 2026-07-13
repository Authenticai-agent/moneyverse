'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, csrfToken: 'client-csrf' }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'auth.invalid_credentials');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-mv-light">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-mv-dark">Welcome back</h1>
        <p className="mb-6 text-mv-dark/70">Sign in to your MoneyVerse account.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error === 'auth.invalid_credentials' ? "We couldn't sign you in with those details." : error}
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          New to MoneyVerse?{' '}
          <Link prefetch={false} href="/register" className="text-mv-primary font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
