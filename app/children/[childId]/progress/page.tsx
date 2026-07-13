'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResolvedParams } from '@/lib/useResolvedParams';

interface LessonProgress {
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface Mastery {
  status: string;
  evidence: unknown;
}

interface LessonItem {
  id: string;
  title: string;
  description: string | null;
  moduleTitle: string;
  minAge: number;
  maxAge: number;
  progress: LessonProgress | null;
  mastery: Mastery | null;
}

interface Child {
  id: string;
  nickname: string;
  age: number;
}

export default function ProgressPage({ params }: { params: Promise<{ childId: string }> }) {
  const routeParams = useResolvedParams(params);
  const [child, setChild] = useState<Child | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!routeParams) return;
    const { childId } = routeParams;

    async function load() {
      const res = await fetch(`/api/families/current/children/${childId}/progress`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        } else {
          setError('Could not load progress.');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setChild(data.child);
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

  if (!child) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Child not found.</p>
      </main>
    );
  }

  const completedCount = lessons.filter((l) => l.progress?.status === 'completed').length;
  const masteredCount = lessons.filter((l) => l.mastery?.status === 'achieved').length;

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-mv-dark">{child.nickname}</h1>
            <p className="text-mv-dark/70">Progress dashboard</p>
          </div>
          <Link prefetch={false}
            href={`/children/${childId}`}
            className="px-4 py-2 rounded-lg border border-mv-dark/20 text-mv-dark hover:bg-mv-lavender"
          >
            Back to profile
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-mv-dark/70">Total lessons</p>
            <p className="text-2xl font-bold text-mv-dark">{lessons.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-mv-dark/70">Completed</p>
            <p className="text-2xl font-bold text-mv-dark">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-mv-dark/70">Mastered</p>
            <p className="text-2xl font-bold text-mv-dark">{masteredCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-mv-dark/70">Learning XP</p>
            <p className="text-2xl font-bold text-mv-primary">{xp}</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          {lessons.length === 0 ? (
            <p className="text-mv-dark/70">No lessons are available for this age yet.</p>
          ) : (
            <ul className="space-y-4">
              {lessons.map((lesson) => (
                <li key={lesson.id} className="p-4 rounded-xl bg-mv-lavender/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-mv-primary">{lesson.moduleTitle}</p>
                      <p className="font-semibold text-mv-dark">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-sm text-mv-dark/70">{lesson.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {lesson.progress?.status === 'completed' ? (
                        <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                          Completed
                        </span>
                      ) : lesson.progress?.status === 'started' ? (
                        <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                          Started
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                          Not started
                        </span>
                      )}
                      {lesson.mastery?.status === 'achieved' && (
                        <span className="block mt-1 text-xs font-medium text-emerald-700">
                          Mastered
                        </span>
                      )}
                      {lesson.progress?.score !== null && lesson.progress?.score !== undefined && (
                        <span className="block mt-1 text-xs text-mv-dark/70">
                          Score: {lesson.progress.score}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
