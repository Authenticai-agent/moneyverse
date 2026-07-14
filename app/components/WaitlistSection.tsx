'use client';

import { useState } from 'react';
import Turnstile from './Turnstile';

type Interest = 'parent' | 'teacher';

export default function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState<Interest>('parent');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [website, setWebsite] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, interest, 'cf-turnstile-response': turnstileToken, website }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-mv-primary mb-2">Join the MoneyVerse waitlist</h2>
      <p className="text-mv-dark/70 mb-6">
        Be the first to know when the full family dashboard and classroom tools are ready.
      </p>

      {submitted ? (
        <div className="p-4 bg-mv-green/10 rounded-xl border border-mv-green">
          <p className="font-semibold text-mv-dark">You are on the list!</p>
          <p className="text-sm text-mv-dark/70">
            We will only use your email to share MoneyVerse updates. No spam, no child data.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-mv-lavender px-4 py-3 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
              />
            </label>
            <div className="flex rounded-lg border border-mv-lavender overflow-hidden">
              <button
                type="button"
                onClick={() => setInterest('parent')}
                className={`px-4 py-3 text-sm font-medium ${
                  interest === 'parent' ? 'bg-mv-primary text-white' : 'bg-white text-mv-dark hover:bg-mv-lavender'
                }`}
              >
                Parent
              </button>
              <button
                type="button"
                onClick={() => setInterest('teacher')}
                className={`px-4 py-3 text-sm font-medium ${
                  interest === 'teacher' ? 'bg-mv-primary text-white' : 'bg-white text-mv-dark hover:bg-mv-lavender'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 left-0 top-0 h-0 w-0"
          />
          <Turnstile onVerify={setTurnstileToken} />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Get early access'}
          </button>
          <p className="text-xs text-mv-dark/60">
            We do not ask for child data, birth dates, or financial information.
          </p>
        </form>
      )}
    </section>
  );
}
