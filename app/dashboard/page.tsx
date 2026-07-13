'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Child {
  id: string;
  nickname: string;
  age: number;
  avatar?: string;
}

interface Family {
  id: string;
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [meRes, childrenRes] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/families/current/children'),
        ]);

        if (!meRes.ok) {
          router.push('/login');
          return;
        }

        if (childrenRes.ok) {
          const data = await childrenRes.json();
          setChildren(data.children || []);
          setFamily(data.family || null);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-mv-dark">Parent dashboard</h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="px-4 py-2 rounded-lg border border-mv-dark/20 text-mv-dark hover:bg-mv-lavender"
          >
            Sign out
          </button>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-mv-dark">Children</h2>
            <Link prefetch={false}
              href="/children/new"
              className="px-4 py-2 rounded-lg bg-mv-primary text-white text-sm font-medium hover:bg-mv-primary/90"
            >
              Add child
            </Link>
          </div>

          {children.length === 0 ? (
            <p className="text-mv-dark/70">No child profiles yet. Add one to get started.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.map((child) => (
                <li key={child.id}>
                  <Link prefetch={false}
                    href={`/children/${child.id}`}
                    className="block p-4 rounded-xl bg-mv-lavender hover:bg-mv-lavender/80 transition"
                  >
                    <p className="font-semibold text-mv-dark">{child.nickname}</p>
                    <p className="text-sm text-mv-dark/70">Age: {child.age}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
