'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResolvedParams } from '@/lib/useResolvedParams';

interface Slide {
  type: string;
  text: string;
  options?: string[];
  answer?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  minAge: number;
  maxAge: number;
  content: {
    slides: Slide[];
  };
}

interface Progress {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  lessonVersionId: string;
  score: number | null;
}

interface AnswerResult {
  correct: boolean;
  score: number;
  quizSlideCount: number;
  masteryStatus: string;
}

export default function LessonPlayer({ params }: { params: Promise<{ childId: string; lessonId: string }> }) {
  const routeParams = useResolvedParams(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, AnswerResult>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    if (!routeParams) return;
    const { childId, lessonId } = routeParams;

    async function load() {
      const res = await fetch(`/api/families/current/children/${childId}/lessons/${lessonId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        } else if (res.status === 403) {
          setError('This lesson is not available for this age.');
        } else {
          setError('Could not load this lesson.');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLesson(data.lesson);
      setProgress(data.progress);
      setLoading(false);
    }

    load();
  }, [routeParams, router]);

  if (!routeParams) return null;
  const { childId, lessonId } = routeParams;

  async function handleAnswer(slideIndex: number) {
    const answer = selected[slideIndex];
    if (!answer) return;

    setSubmitting((prev) => ({ ...prev, [slideIndex]: true }));
    const res = await fetch(`/api/families/current/children/${childId}/lessons/${lessonId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideIndex, answer }),
    });

    setSubmitting((prev) => ({ ...prev, [slideIndex]: false }));

    if (!res.ok) {
      setError('Could not submit answer.');
      return;
    }

    const data = await res.json();
    setResults((prev) => ({ ...prev, [slideIndex]: data }));
    setProgress((prev) => (prev ? { ...prev, score: data.score } : prev));
  }

  async function handleComplete() {
    setCompleting(true);
    const res = await fetch(`/api/families/current/children/${childId}/lessons/${lessonId}/progress`, {
      method: 'POST',
    });

    if (!res.ok) {
      setCompleting(false);
      setError('Could not save progress.');
      return;
    }

    const data = await res.json();
    setProgress(data.progress);
    setCompleting(false);
  }

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
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link prefetch={false}
            href={`/children/${childId}/lessons`}
            className="px-4 py-2 rounded-lg border border-mv-dark/20 text-mv-dark hover:bg-mv-lavender"
          >
            Back to lessons
          </Link>
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Lesson not found.</p>
      </main>
    );
  }

  const completed = progress?.status === 'completed';

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-3xl mx-auto">
        <Link prefetch={false}
          href={`/children/${childId}/lessons`}
          className="inline-block mb-6 px-4 py-2 rounded-lg border border-mv-dark/20 text-mv-dark hover:bg-mv-lavender"
        >
          Back to lessons
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-mv-dark mb-2">{lesson.title}</h1>
          {lesson.description && <p className="text-mv-dark/70 mb-6">{lesson.description}</p>}

          <div className="space-y-6">
            {lesson.content.slides.map((slide, index) => {
              const result = results[index];
              const isQuiz = slide.options && slide.answer !== undefined;

              return (
                <div key={index} className="p-4 rounded-xl bg-mv-lavender/50">
                  <p className="text-mv-dark whitespace-pre-wrap">{slide.text}</p>
                  {isQuiz && (
                    <div className="mt-4 space-y-3">
                      {slide.options!.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() => setSelected((prev) => ({ ...prev, [index]: option }))}
                          disabled={result !== undefined}
                          className={`w-full text-left px-4 py-2 rounded-lg border transition ${
                            selected[index] === option
                              ? 'bg-mv-primary text-white border-mv-primary'
                              : 'bg-white border-mv-lavender text-mv-dark hover:bg-mv-lavender/50'
                          } ${result !== undefined ? 'opacity-60 cursor-default' : ''}`}
                        >
                          {option}
                        </button>
                      ))}
                      <button
                        onClick={() => handleAnswer(index)}
                        disabled={!selected[index] || submitting[index] || result !== undefined}
                        className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {submitting[index] ? 'Checking...' : 'Submit answer'}
                      </button>
                      {result && (
                        <p
                          className={`text-sm font-medium ${
                            result.correct ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {result.correct
                            ? 'Nice work. You practiced a new money skill.'
                            : 'That choice had a tradeoff. Try another strategy.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-mv-dark/70">
            {completed ? 'Lesson completed' : 'Start learning'}
          </p>
          {!completed && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 disabled:opacity-50"
            >
              {completing ? 'Saving...' : 'Mark as complete'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
