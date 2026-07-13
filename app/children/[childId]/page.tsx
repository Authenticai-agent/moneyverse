'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResolvedParams } from '@/lib/useResolvedParams';

interface Child {
  id: string;
  nickname: string;
  age: number;
  xp: number;
}

export default function ChildDashboard({ params }: { params: Promise<{ childId: string }> }) {
  const routeParams = useResolvedParams(params);
  const [child, setChild] = useState<Child | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!routeParams) return;
    const { childId } = routeParams;

    async function load() {
      const res = await fetch(`/api/families/current/children/${childId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        } else {
          setError('Could not load this profile.');
        }
        return;
      }

      const data = await res.json();
      setChild(data.child);
    }

    load();
  }, [routeParams, router]);

  if (!routeParams) return null;
  const { childId } = routeParams;

  async function handleDelete() {
    if (!confirm('Are you sure you want to remove this child profile?')) {
      return;
    }

    setDeleting(true);
    const res = await fetch(`/api/families/current/children/${childId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setDeleting(false);
      setError('Could not remove this profile.');
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!child) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-mv-dark mb-2">{child.nickname}</h1>
        <p className="text-mv-dark/70 mb-6">Welcome back to MoneyVerse.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-mv-lavender">
            <p className="text-sm font-medium text-mv-dark/70">Age</p>
            <p className="text-lg text-mv-dark">{child.age}</p>
          </div>
          <div className="p-4 rounded-xl bg-mv-lavender">
            <p className="text-sm font-medium text-mv-dark/70">Learning XP</p>
            <p className="text-lg font-semibold text-mv-primary">{child.xp ?? 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link prefetch={false}
            href={`/children/${childId}/lessons`}
            className="px-4 py-2 rounded-lg bg-mv-primary text-white hover:bg-mv-primary/90"
          >
            View lessons
          </Link>
          <Link prefetch={false}
            href={`/children/${childId}/progress`}
            className="px-4 py-2 rounded-lg bg-mv-lavender text-mv-dark hover:bg-mv-lavender/80"
          >
            View progress
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? 'Removing...' : 'Remove child'}
          </button>
        </div>
      </div>
    </main>
  );
}
