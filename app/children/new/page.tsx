'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewChildPage() {
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState<number>(9);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/families/current/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, age }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/children/${data.child.id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'internal_error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-mv-light">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-mv-dark">Add a child profile</h1>
        <p className="mb-6 text-mv-dark/70">No full date of birth is required.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            Something went wrong. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mv-dark/20 focus:outline-none focus:ring-2 focus:ring-mv-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              min={0}
              max={17}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-mv-dark/20 focus:outline-none focus:ring-2 focus:ring-mv-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating profile...' : 'Create profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
