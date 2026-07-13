'use client';

/**
 * MoneyVerseHero — "Learn money by living it" hero (design 2a)
 * ------------------------------------------------------------
 * Drop-in landing hero for the MoneyVerse Next.js app.
 * Stack: Next 15 App Router · React 19 · Tailwind 3.4 (`mv` tokens) · next/font (Fredoka/Inter).
 * No extra dependencies (emoji used as icons, same as the prototype).
 *
 * Right column is an auto-rotating carousel that cycles three "adventure" cards:
 *   0 · Grow a business (Zoe's Cookie Co.)  1 · Outsmart a scam (Scam Shield)  2 · Save for a goal (Bike Fund)
 * Dots jump between cards; hovering the carousel pauses rotation.
 * Each card replays its count-ups + chart/bar animations every time it becomes active.
 */

import { useEffect, useRef, useState } from 'react';

/* ---------------- keyframes (injected once) ---------------- */
const KEYFRAMES = `
@keyframes mvhFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mvhRise { 0% { transform: translateY(26px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes mvhPop  { 0% { transform: scale(0); opacity: 0; } 68% { transform: scale(1.14); } 100% { transform: scale(1); opacity: 1; } }
@keyframes mvhDraw { to { stroke-dashoffset: 0; } }
@keyframes mvhPing { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(3.4); opacity: 0; } }
@keyframes mvhFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes mvhRadar { to { width: 92%; } }
@keyframes mvhBikeFill { to { width: 65%; } }

/* animations only run on the active card, so they replay on every activation */
.mvh-tooltip { opacity: 0; }
.mvh-card[data-active="true"] .mvh-tooltip { animation: mvhFade .6s ease 1.3s both; }
.mvh-area { opacity: 0; }
.mvh-card[data-active="true"] .mvh-area { animation: mvhFade .9s ease 1.1s forwards; }
.mvh-line { stroke-dasharray: 520; stroke-dashoffset: 520; }
.mvh-card[data-active="true"] .mvh-line { animation: mvhDraw 1.5s cubic-bezier(.4,.7,.3,1) .5s forwards; }
.mvh-card[data-active="true"] .mvh-ping { animation: mvhPing 1.9s ease-out 1.4s infinite; }
.mvh-pop { opacity: 0; transform: scale(0); }
.mvh-card[data-active="true"] .mvh-pop {
  animation-name: mvhPop; animation-duration: .5s;
  animation-timing-function: cubic-bezier(.2,1.3,.4,1); animation-fill-mode: both;
}
.mvh-radar { width: 0; }
.mvh-card[data-active="true"] .mvh-radar { animation: mvhRadar 1.3s cubic-bezier(.3,.9,.3,1) .3s forwards; }
.mvh-bikefill { width: 0; }
.mvh-card[data-active="true"] .mvh-bikefill { animation: mvhBikeFill 1.4s cubic-bezier(.3,.9,.3,1) .4s forwards; }
@media (prefers-reduced-motion: reduce) {
  .mvh-card * { animation: none !important; }
  .mvh-area { opacity: 1; } .mvh-line { stroke-dashoffset: 0; }
  .mvh-pop { opacity: 1; transform: none; }
  .mvh-radar { width: 92%; } .mvh-bikefill { width: 65%; } .mvh-tooltip { opacity: 1; }
}
`;

/* ---------------- count-up number ---------------- */
function CountUp({
  to,
  active,
  prefix = '',
  suffix = '',
  compact = false,
}: {
  to: number;
  active: boolean;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setV(to * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, to]);

  const fmt = (n: number) => {
    if (compact) {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'K';
      return String(Math.round(n));
    }
    return Math.round(n).toLocaleString();
  };
  return <>{prefix + fmt(v) + suffix}</>;
}

/* ---------------- shared bits ---------------- */
const CARD_BASE =
  'mvh-card absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(.2,.9,.3,1)]';
const CARD_SHELL: React.CSSProperties = {
  width: 472,
  position: 'relative',
  background: 'rgba(255,255,255,.94)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #ECE7FB',
  borderRadius: 26,
  boxShadow: '0 34px 68px -28px rgba(80,60,150,.5)',
  padding: 22,
};
const TILE: React.CSSProperties = { background: '#FAF9FE', border: '1px solid #F0ECFA', borderRadius: 18 };

type CardProps = { active: boolean };

/* ---------------- CARD 0 · Grow a business ---------------- */
function CardBusiness({ active }: CardProps) {
  return (
    <div style={CARD_SHELL}>
      <div style={badge('#6B4EFF', '#fff', 'rgba(107,78,255,.7)')}>🏢 Grow-a-business adventure</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-2xl" style={avatar('radial-gradient(circle at 34% 28%,#FFE29A,#FFB74D)')}>🍪</div>
          <div>
            <div className="font-display text-[17px] font-semibold text-mv-dark">Zoe&apos;s Cookie Co.</div>
            <div className="text-xs text-[#8480A0]">CEO · Level 4</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: '#FFF3CF', color: '#A9760A' }}>🔥 6 days</span>
      </div>

      {/* revenue chart */}
      <div className="relative mt-[18px] p-4" style={TILE}>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-[#413B5A]">Monthly revenue</span>
          <span className="rounded-full px-2.5 py-[3px] text-[11.5px] font-bold" style={{ background: '#EAFBF2', color: '#2F9E67' }}>▲ 38%</span>
        </div>
        <div className="mvh-tooltip absolute right-3 top-3 rounded-xl bg-white px-3 py-1.5 text-right" style={{ boxShadow: '0 8px 20px -8px rgba(80,60,150,.5)' }}>
          <div className="font-display text-[17px] font-bold leading-none text-mv-primary">$<CountUp to={1240} active={active} /></div>
          <div className="mt-px text-[10px] text-[#A8A2C0]">June</div>
        </div>
        <svg width="100%" height="118" viewBox="0 0 406 118" preserveAspectRatio="none" className="mt-2.5 block">
          <line x1="6" y1="34" x2="400" y2="34" stroke="#ECE6FA" strokeWidth="1" />
          <line x1="6" y1="64" x2="400" y2="64" stroke="#ECE6FA" strokeWidth="1" />
          <line x1="6" y1="94" x2="400" y2="94" stroke="#ECE6FA" strokeWidth="1" />
          <defs>
            <linearGradient id="mvhArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6B4EFF" stopOpacity="0.26" />
              <stop offset="1" stopColor="#6B4EFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="mvh-area" d="M10,96 C46,90 58,80 92,80 C124,80 140,90 168,86 C200,82 214,58 246,54 C280,50 296,46 328,42 C360,38 376,28 396,22 L396,116 L10,116 Z" fill="url(#mvhArea)" />
          <path className="mvh-line" d="M10,96 C46,90 58,80 92,80 C124,80 140,90 168,86 C200,82 214,58 246,54 C280,50 296,46 328,42 C360,38 376,28 396,22" fill="none" stroke="#6B4EFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="mvh-ping" cx="396" cy="22" r="6" fill="#6B4EFF" style={{ transformBox: 'view-box', transformOrigin: '396px 22px' }} />
          <circle cx="396" cy="22" r="5.5" fill="#6B4EFF" />
          <circle cx="396" cy="22" r="2" fill="#fff" />
        </svg>
        <div className="mt-1 flex justify-between text-[10.5px] font-medium text-[#A8A2C0]">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
        </div>
      </div>

      {/* team + tax */}
      <div className="mt-3.5 grid grid-cols-2 gap-[13px]">
        <div className="px-[15px] py-3.5" style={TILE}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#413B5A]">Your team</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: '#EDE6FF', color: '#5A3EE6' }}>3</span>
          </div>
          <div className="mt-[11px] flex flex-col gap-2">
            {[
              { i: 'S', c: '#6B4EFF', n: 'Sam', t: 'W-2', d: '.6s' },
              { i: 'A', c: '#2FB8BE', n: 'Ava', t: 'W-2', d: '.75s' },
              { i: 'M', c: '#F3C218', n: 'Max', t: '1099', d: '.9s' },
            ].map((m) => (
              <div key={m.i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="mvh-pop flex h-6 w-6 items-center justify-center rounded-full font-display text-[11px] font-bold text-white" style={{ background: m.c, animationDelay: m.d }}>{m.i}</div>
                  <span className="text-[12.5px] text-[#3A3550]">{m.n}</span>
                </div>
                <span className="rounded-md px-[7px] py-0.5 text-[10px] font-bold" style={m.t === '1099' ? { background: '#E4F9FA', color: '#127C82' } : { background: '#EDE6FF', color: '#5A3EE6' }}>{m.t}</span>
              </div>
            ))}
            <div className="mt-0.5 flex items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-[#D9CFF2] p-1.5 text-[11.5px] font-semibold text-[#8B7FC0]">＋ Hire</div>
          </div>
        </div>

        <div className="px-[15px] py-3.5" style={TILE}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#413B5A]">Tax Center</span>
            <span className="rounded-md px-[7px] py-0.5 text-[9.5px] font-bold" style={{ background: '#EAFBF2', color: '#2F9E67' }}>AUTO · IRS</span>
          </div>
          <div className="mt-[11px] flex flex-col gap-[7px] text-[12.5px]">
            {[['Federal', 82], ['State', 41], ['City', 25]].map(([label, n]) => (
              <div key={label as string} className="flex justify-between text-[#6E6A85]">
                <span>{label}</span>
                <span className="font-semibold text-[#3A3550]">$<CountUp to={n as number} active={active} /></span>
              </div>
            ))}
            <div className="my-[3px] h-px bg-[#EDE7F8]" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#413B5A]">Set aside</span>
              <span className="font-display text-[15px] font-bold text-mv-primary">$<CountUp to={148} active={active} /></span>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-[#A8A2C0]">from $820 profit this month</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CARD 1 · Outsmart a scam ---------------- */
function CardScam({ active }: CardProps) {
  const flags = [
    { t: '⚠️ Too good to be true', d: '.2s' },
    { t: '🔗 Sketchy link', d: '.4s' },
    { t: '⏰ Rushing you', d: '.6s' },
  ];
  return (
    <div style={CARD_SHELL}>
      <div style={badge('#2FB8BE', '#fff', 'rgba(47,184,190,.7)')}>🛡️ Outsmart-a-scam adventure</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-[23px]" style={avatar('radial-gradient(circle at 34% 28%,#7FE9EE,#2FB8BE)')}>🛡️</div>
          <div>
            <div className="font-display text-[17px] font-semibold text-mv-dark">Scam Shield</div>
            <div className="text-xs text-[#8480A0]">Detective · Level 3</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: '#E4F9FA', color: '#127C82' }}>🎯 12 caught</span>
      </div>

      {/* suspicious message */}
      <div className="mt-[18px] p-4" style={TILE}>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#E5533C' }} />
          <span className="text-[12.5px] font-semibold text-[#413B5A]">Unknown sender</span>
          <span className="text-[11px] text-[#A8A2C0]">· now</span>
        </div>
        <div className="text-[13.5px] leading-[1.5] text-[#3A3550]" style={{ background: '#fff', border: '1px solid #F0ECFA', borderRadius: '4px 16px 16px 16px', padding: '13px 15px' }}>
          🎉 You <b>WON a $500 gift card!</b> Claim in the next 10 min 👉 <span className="underline" style={{ color: '#2F7BD6' }}>bit.ly/claim-now-free</span>
        </div>
      </div>

      {/* red flags */}
      <div className="mt-3.5">
        <div className="mb-[9px] text-[12.5px] font-semibold text-[#413B5A]">Red flags you caught</div>
        <div className="flex flex-wrap gap-2">
          {flags.map((f) => (
            <span key={f.t} className="mvh-pop inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-[12.5px] font-semibold" style={{ background: '#FDECEC', border: '1px solid #F7D3D3', color: '#C0392B', animationDelay: f.d }}>{f.t}</span>
          ))}
        </div>
      </div>

      {/* verdict */}
      <div className="mvh-pop mt-3.5 flex items-center gap-3 px-[15px] py-3.5" style={{ background: '#EAFBF2', border: '1px solid #CDEFDD', borderRadius: 16, animationDelay: '.85s' }}>
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[19px] text-white" style={{ background: '#2F9E67' }}>🚩</div>
        <div className="flex-1">
          <div className="font-display text-[15px] font-semibold text-mv-dark">It&apos;s a scam. Nice catch!</div>
          <div className="text-xs text-[#3E9C6B]">You kept your coins safe.</div>
        </div>
        <span className="shrink-0 rounded-full px-[11px] py-1.5 text-[12.5px] font-bold text-white" style={{ background: '#2F9E67' }}>+<CountUp to={40} active={active} /> XP</span>
      </div>

      {/* scam radar */}
      <div className="mt-3.5 px-[15px] py-[13px]" style={{ ...TILE, borderRadius: 16 }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-[#413B5A]">Scam radar</span>
          <span className="text-xs font-bold" style={{ color: '#2FB8BE' }}>Sharp 🔍</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: '#EDE7F8' }}>
          <div className="mvh-radar h-full rounded-full" style={{ background: 'linear-gradient(90deg,#5CE1E6,#2FB8BE)' }} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- CARD 2 · Save for a goal ---------------- */
function CardBike({ active }: CardProps) {
  const milestones = [
    { done: true, t: 'Helmet fund · $20', d: '.3s' },
    { done: true, t: 'First $50 saved', d: '.45s' },
    { done: true, t: 'Halfway there 🎉', d: '.6s' },
    { done: false, t: 'New bike unlocked', d: '0s' },
  ];
  return (
    <div style={CARD_SHELL}>
      <div style={badge('#FFD84D', '#8A5A12', 'rgba(243,194,24,.7)')}>🚲 Save-for-a-goal adventure</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-[23px]" style={avatar('radial-gradient(circle at 34% 28%,#8B74FF,#6B4EFF)')}>🚲</div>
          <div>
            <div className="font-display text-[17px] font-semibold text-mv-dark">Zoe&apos;s Bike Fund</div>
            <div className="text-xs text-[#8480A0]">Goal · Trail Blazer 20&rdquo;</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: '#FFF3CF', color: '#A9760A' }}>🔥 6 days</span>
      </div>

      {/* goal progress */}
      <div className="mt-[18px] p-4" style={TILE}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#413B5A]">Mountain bike</span>
          <span className="text-xs text-[#8480A0]">Target $180</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-[7px]">
          <span className="font-display text-[30px] font-bold leading-none text-mv-primary">$<CountUp to={117} active={active} /></span>
          <span className="text-sm text-[#A8A2C0]">saved so far</span>
        </div>
        <div className="relative mt-3.5 h-[22px]">
          <div className="absolute inset-x-0 top-1 h-3.5 rounded-full" style={{ background: '#EDE7F8' }} />
          <div className="mvh-bikefill absolute left-0 top-1 h-3.5 rounded-full" style={{ background: 'linear-gradient(90deg,#8B74FF,#6B4EFF)' }}>
            <div className="absolute -right-[11px] top-1/2 -translate-y-1/2 text-[19px]" style={{ filter: 'drop-shadow(0 3px 4px rgba(107,78,255,.4))' }}>🚲</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: '#2F9E67' }}>65% there</span>
          <span className="text-xs text-[#8480A0]">4 weeks to go 🎉</span>
        </div>
      </div>

      {/* week + auto-save */}
      <div className="mt-3.5 grid grid-cols-2 gap-[13px]">
        <div className="px-[15px] py-3.5" style={{ background: '#EAFBF2', border: '1px solid #D5EFDF', borderRadius: 18 }}>
          <div className="text-xs font-medium text-[#3E9C6B]">This week</div>
          <div className="font-display text-[22px] font-bold text-[#3E9C6B]">+$<CountUp to={15} active={active} /></div>
        </div>
        <div className="px-[15px] py-3.5" style={{ background: '#EDE6FF', border: '1px solid #DED3FA', borderRadius: 18 }}>
          <div className="text-xs font-medium text-[#5A3EE6]">Auto-save</div>
          <div className="font-display text-[22px] font-bold text-mv-primary">$15<span className="text-[13px] text-[#8B7FC0]"> /wk</span></div>
        </div>
      </div>

      {/* milestones */}
      <div className="mt-3.5 px-4 py-3.5" style={TILE}>
        <div className="mb-[11px] text-[13px] font-semibold text-[#413B5A]">Milestones</div>
        <div className="flex flex-col gap-[9px] text-[12.5px]">
          {milestones.map((m) => (
            <div key={m.t} className="flex items-center gap-[9px]">
              <span
                className={m.done ? 'mvh-pop flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] text-white' : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]'}
                style={m.done ? { background: '#2F9E67', animationDelay: m.d } : { background: '#ECE6F6', color: '#B4ABCE' }}
              >
                {m.done ? '✓' : '🔒'}
              </span>
              <span style={{ color: m.done ? '#3A3550' : '#A8A2C0' }}>{m.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function badge(bg: string, color: string, shadow: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: -13,
    left: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: bg,
    color,
    fontWeight: 700,
    fontSize: 11,
    padding: '5px 12px',
    borderRadius: 999,
    boxShadow: `0 8px 18px -6px ${shadow}`,
  };
}
function avatar(bg: string): React.CSSProperties {
  return { width: 46, height: 46, borderRadius: '50%', background: bg, flexShrink: 0 };
}

/* ---------------- main component ---------------- */
const CHIPS = ['🛡️ Outsmart scams', '🏢 Grow a business', '🚲 Save for a goal', '🧾 Real money math'];
const CARDS = [CardBusiness, CardScam, CardBike];
const ROTATE_MS = 5200;

export default function MoneyVerseHero() {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const start = () => {
    stop();
    timer.current = setInterval(() => setActive((i) => (i + 1) % CARDS.length), ROTATE_MS);
  };
  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    start(); // reset timer on manual nav
  };

  return (
    <section className="relative overflow-hidden bg-[#FBFBFE]">
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* decorative background */}
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full" style={{ background: 'radial-gradient(circle,#EDE7FF 0%,rgba(237,231,255,0) 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-36 -left-24 h-[420px] w-[420px] rounded-full" style={{ background: 'radial-gradient(circle,#FFF4CE 0%,rgba(255,244,206,0) 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(#E7E2F6 1.3px, transparent 1.3px)', backgroundSize: '26px 26px', opacity: 0.45 }} />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
        {/* ---- left column ---- */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full px-[15px] py-2 text-[13px] font-semibold" style={{ background: '#EDE6FF', color: '#5A3EE6' }}>
            ✨ Money skills, disguised as play
          </span>
          <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-[-1px] text-mv-dark sm:text-[56px]">
            Learn money by<br />
            <span className="text-mv-primary">living it.</span>
          </h1>
          <p className="mt-5 max-w-[452px] text-[19px] leading-[1.55] text-[#4A4560]">
            Outsmart a scam. Grow a business. Save up for that bike. MoneyVerse turns real financial skills into
            adventures kids actually finish, with every number worked out just like real life.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {CHIPS.map((c) => (
              <span key={c} className="rounded-xl bg-white px-[15px] py-[9px] text-[13.5px] font-semibold text-[#413B5A]" style={{ border: '1.5px solid #EDE7FA' }}>{c}</span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <a href="/tools" className="inline-flex items-center gap-2 rounded-full bg-mv-primary px-[26px] py-[15px] text-base font-semibold text-white transition-colors hover:bg-mv-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mv-primary" style={{ boxShadow: '0 14px 30px -10px rgba(107,78,255,.7)' }}>
              Explore free tools <span className="text-lg">→</span>
            </a>
            <a href="/register" className="inline-flex items-center rounded-full bg-white px-[26px] py-[15px] text-base font-semibold text-[#5A3EE6] transition-colors hover:bg-mv-lavender/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mv-primary" style={{ border: '1.5px solid #D9CFF5' }}>
              Join the waitlist
            </a>
          </div>

          <p className="mt-4 flex max-w-[452px] items-start gap-2.5 text-[13.5px] leading-[1.5] text-[#6E6A85]">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-mv-primary" style={{ background: '#EDE6FF' }}>＋</span>
            <span>
              <b className="font-semibold text-[#413B5A]">Join the waitlist for MoneyVerse Plus updates:</b> advanced
              simulators (business, credit &amp; real-life money), parent-set missions, allowance &amp; family goals,
              and a classroom edition for teachers. We will email you when the paid version is ready.
            </span>
          </p>
        </div>

        {/* ---- right column: carousel ---- */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-5">
            <div
              className="relative h-[556px] w-[472px] max-w-full"
              onMouseEnter={stop}
              onMouseLeave={start}
              role="group"
              aria-roledescription="carousel"
              aria-label="MoneyVerse adventures"
            >
              {CARDS.map((Card, i) => (
                <div
                  key={i}
                  data-active={active === i}
                  className={CARD_BASE}
                  style={{
                    opacity: active === i ? 1 : 0,
                    transform: active === i ? 'none' : 'translateY(22px) scale(.97)',
                    zIndex: active === i ? 2 : 1,
                    pointerEvents: active === i ? 'auto' : 'none',
                  }}
                  aria-hidden={active !== i}
                >
                  <Card active={active === i} />
                </div>
              ))}
            </div>

            {/* dots */}
            <div className="flex items-center gap-2.5">
              {CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={['Grow a business', 'Outsmart a scam', 'Save for a goal'][i]}
                  aria-current={active === i}
                  className="h-2.5 rounded-full transition-[width,background] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mv-primary"
                  style={{ width: active === i ? 26 : 9, background: active === i ? '#6B4EFF' : '#D9D2F0' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
