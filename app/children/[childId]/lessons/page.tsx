'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResolvedParams } from '@/lib/useResolvedParams';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  minAge: number;
  maxAge: number;
  moduleTitle: string;
  progressStatus: string | null;
}

export default function LessonsPage({ params }: { params: Promise<{ childId: string }> }) {
  const routeParams = useResolvedParams(params);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!routeParams) return;
    const { childId } = routeParams;

    async function load() {
      const res = await fetch(`/api/families/current/children/${childId}/lessons`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        } else {
          setError('Could not load lessons.');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLessons(data.lessons || []);
      setXp(data.xp ?? 0);
      setLoading(false);
    }

    load();
  }, [routeParams, router]);

  if (!routeParams) return null;
  const { childId } = routeParams;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-mv-dark">Lessons</h1>
          <div className="flex items-center gap-4">
            <p className="text-mv-dark font-semibold">XP: {xp}</p>
            <Link prefetch={false}
              href={`/children/${childId}`}
              className="px-4 py-2 rounded-lg border border-mv-dark/20 text-mv-dark hover:bg-mv-lavender"
            >
              Back to profile
            </Link>
          </div>
        </header>

        {lessons.length === 0 ? (
          <p className="text-mv-dark/70">No lessons are available for this age yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link prefetch={false}
                  href={`/children/${childId}/lessons/${lesson.id}`}
                  className="block p-4 rounded-xl bg-white hover:bg-mv-lavender transition shadow-sm"
                >
                  <p className="text-sm font-medium text-mv-primary">{lesson.moduleTitle}</p>
                  <p className="font-semibold text-mv-dark">{lesson.title}</p>
                  {lesson.description && (
                    <p className="text-sm text-mv-dark/70 line-clamp-2">{lesson.description}</p>
                  )}
                  <p className="text-sm text-mv-dark/50 mt-2">
                    Ages {lesson.minAge}–{lesson.maxAge}
                  </p>
                  {lesson.progressStatus === 'completed' && (
                    <span className="inline-block mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      Completed
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
