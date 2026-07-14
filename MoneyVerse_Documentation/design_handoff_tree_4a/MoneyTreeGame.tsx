'use client';

/**
 * MoneyTreeGame — Money Tree Simulator game page (design 4a)
 * ----------------------------------------------------------
 * Client component for /tools/money-tree-calculator. Same visual language as
 * MoneyVerseHero (2a) and ToolsIndex (3a).
 * Stack: Next 15 App Router · React 19 · Tailwind 3.4 (`mv` tokens) · next/font (Fredoka/Inter).
 * No new dependencies (emoji, CSS keyframes, requestAnimationFrame).
 *
 * Math is identical to the existing MoneyTreeForm: weekly compounding
 * FV = P(1+r/52)^w + c·((1+r/52)^w − 1)/(r/52), optional −2.5%/yr inflation drag.
 *
 * Usage: keep `app/tools/money-tree-calculator/page.tsx` as the server component
 * that owns `metadata`, and render <MoneyTreeGame /> from it (see README).
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------- keyframes + slider skin (injected once) ---------------- */
const STYLES = `
@keyframes mvgRise { 0% { transform: translateY(26px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes mvgPop { 0% { transform: scale(0); opacity: 0; } 68% { transform: scale(1.14); } 100% { transform: scale(1); opacity: 1; } }
@keyframes mvgBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes mvgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes mvgDrift { 0% { transform: translateX(-40px); } 100% { transform: translateX(40px); } }
@keyframes mvgConfetti { 0% { transform: translateY(-16px) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(190px) rotate(340deg); opacity: 0; } }

.mvg-rise { animation: mvgRise .6s cubic-bezier(.2,.9,.3,1) both; }
.mvg-pop { animation: mvgPop .5s cubic-bezier(.2,1.3,.4,1) both; }
.mvg-bob { animation: mvgBob 6s ease-in-out infinite; }
.mvg-float { animation: mvgFloat 7s ease-in-out infinite; }
.mvg-drift-a { animation: mvgDrift 11s ease-in-out infinite alternate; }
.mvg-drift-b { animation: mvgDrift 14s ease-in-out 1s infinite alternate-reverse; }

input[type="range"].mvg-range { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 999px; background: #EDE7F8; outline: none; }
input[type="range"].mvg-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #6B4EFF; border: 3px solid #fff; box-shadow: 0 3px 8px rgba(107,78,255,.5); cursor: pointer; }
input[type="range"].mvg-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #6B4EFF; border: 3px solid #fff; box-shadow: 0 3px 8px rgba(107,78,255,.5); cursor: pointer; }
input[type="range"].mvg-range:focus-visible { outline: 2px solid #6B4EFF; outline-offset: 3px; }

.mvg-btn { transition: background .2s ease; }
.mvg-btn:focus-visible { outline: 2px solid #6B4EFF; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .mvg-rise, .mvg-pop { animation: none !important; }
  .mvg-bob, .mvg-float, .mvg-drift-a, .mvg-drift-b { animation: none !important; }
  .mvg-confetti-piece { animation: none !important; opacity: 0 !important; }
}
`;

/* ---------------- math (same as MoneyTreeForm) ---------------- */
type Params = { start: number; weekly: number; rate: number; inflation: boolean };

function futureValue(weeks: number, p: Params): number {
  const annual = Math.max(0, p.rate - (p.inflation ? 2.5 : 0)) / 100;
  if (weeks <= 0) return p.start;
  if (annual === 0) return p.start + p.weekly * weeks;
  const r = annual / 52;
  return p.start * Math.pow(1 + r, weeks) + p.weekly * ((Math.pow(1 + r, weeks) - 1) / r);
}

function stageOf(v: number): number {
  if (v < 1000) return 0;
  if (v < 5000) return 1;
  if (v < 20000) return 2;
  return 3;
}

const money = (n: number) => '$' + Math.round(n).toLocaleString();
const STAGE_LABELS = ['🌱 Seed', '🌿 Sapling', '🌳 Growing Tree', '🌲 Money Forest'];

/* ---------------- small pieces ---------------- */
const COIN_GRADIENT = 'radial-gradient(circle at 32% 28%, #FFECAE, #FFD84D 58%, #F3C218)';

function Coin({ left, bottom, size, sign }: { left: number; bottom: number; size: number; sign?: boolean }) {
  return (
    <div
      className="mvg-pop"
      style={{
        position: 'absolute', left, bottom, width: size, height: size, borderRadius: '50%',
        background: COIN_GRADIENT, boxShadow: '0 4px 10px rgba(243,194,24,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {sign && <span className="font-display" style={{ fontWeight: 700, color: '#8A5A12', fontSize: size * 0.47 }}>$</span>}
    </div>
  );
}

function SideTree({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  const big = side === 'right';
  const w = big ? 120 : 110;
  return (
    <div
      className="mvg-pop"
      style={{
        position: 'absolute', bottom: big ? 90 : 96, zIndex: 2, animationDelay: `${delay}s`,
        ...(side === 'left' ? { left: '11%' } : { right: '9%' }),
      }}
    >
      <div style={{ position: 'relative', width: w, height: big ? 160 : 150 }}>
        <div style={{ position: 'absolute', left: big ? 52 : 48, bottom: 0, width: big ? 16 : 15, height: big ? 66 : 60, borderRadius: 8, background: 'linear-gradient(#B07A46, #8B5A2B)' }} />
        <div style={{ position: 'absolute', left: big ? 18 : 16, bottom: big ? 52 : 48, width: big ? 86 : 80, height: big ? 86 : 80, borderRadius: '50%', background: big ? 'radial-gradient(circle at 38% 32%, #6FDD98, #4FC47E 70%)' : 'radial-gradient(circle at 38% 32%, #7BE3A3, #5FD38D 70%)' }} />
        <div style={{ position: 'absolute', left: big ? 44 : 38, bottom: big ? 112 : 104, width: big ? 24 : 22, height: big ? 24 : 22, borderRadius: '50%', background: COIN_GRADIENT, boxShadow: '0 3px 8px rgba(243,194,24,.5)' }} />
      </div>
    </div>
  );
}

const CONFETTI: Array<{ left: string; size: number; round: boolean; color: string; dur: number; delay: number }> = [
  { left: '12%', size: 12, round: false, color: '#6B4EFF', dur: 2.6, delay: 0 },
  { left: '26%', size: 10, round: true, color: '#FFD84D', dur: 3.0, delay: 0.3 },
  { left: '40%', size: 11, round: false, color: '#5CE1E6', dur: 2.7, delay: 0.6 },
  { left: '54%', size: 12, round: true, color: '#5FD38D', dur: 3.1, delay: 0.15 },
  { left: '68%', size: 10, round: false, color: '#FF8FB1', dur: 2.8, delay: 0.45 },
  { left: '82%', size: 12, round: false, color: '#FFD84D', dur: 2.5, delay: 0.7 },
  { left: '92%', size: 9, round: true, color: '#6B4EFF', dur: 3.2, delay: 0.9 },
];

/* ---------------- slider row ---------------- */
function SliderRow(props: {
  emoji: string; label: string; value: string;
  min: number; max: number; step: number; raw: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#413B5A' }}>{props.emoji} {props.label}</span>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 18, color: '#6B4EFF' }}>{props.value}</span>
      </div>
      <input
        className="mvg-range"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.raw}
        aria-label={props.label}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ==================== component ==================== */
export default function MoneyTreeGame() {
  const [start, setStart] = useState(100);
  const [weekly, setWeekly] = useState(10);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(5);
  const [inflation, setInflation] = useState(false);
  const [pos, setPos] = useState(1); // 0..1 through the timeline
  const [playing, setPlaying] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [shared, setShared] = useState(false);

  const playingRef = useRef(false); // synchronous flag — no setState race
  const rafRef = useRef(0);
  const celebTRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sharedTRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopPlay = useCallback(() => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPos(0);
    setPlaying(true);
    setCelebrating(false);
    const dur = 4500;
    const t0 = performance.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tick = (now: number) => {
      if (!playingRef.current) return;
      const p = Math.min(1, (now - t0) / dur);
      setPos(ease(p));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        playingRef.current = false;
        setPlaying(false);
        setPos(1);
        setCelebrating(true);
        clearTimeout(celebTRef.current);
        celebTRef.current = setTimeout(() => setCelebrating(false), 3400);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const replant = useCallback(() => {
    stopPlay();
    setCelebrating(false);
    setPos(1);
    setStart(100);
    setWeekly(10);
    setYears(5);
    setRate(5);
    setInflation(false);
  }, [stopPlay]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(celebTRef.current);
    clearTimeout(sharedTRef.current);
  }, []);

  /* -------- derived -------- */
  const params: Params = { start, weekly, rate, inflation };
  const totalWeeks = years * 52;
  const w = pos * totalWeeks;
  const v = futureValue(w, params);
  const contributed = start + weekly * Math.floor(w);
  const growth = Math.max(0, v - contributed);
  const stage = stageOf(v);
  const finalV = futureValue(totalWeeks, params);
  const scale = 0.25 + Math.sqrt(Math.min(v, 50000) / 50000) * 0.95;

  const share = useCallback(async () => {
    const text = `🌳 My money tree grew to ${money(futureValue(totalWeeks, params))} in ${years} ${years === 1 ? 'year' : 'years'}! Plant yours: `;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Money Tree — MoneyVerse', text, url });
      } else {
        await navigator.clipboard.writeText(text + url);
        setShared(true);
        clearTimeout(sharedTRef.current);
        sharedTRef.current = setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeeks, years, start, weekly, rate, inflation]);

  const badgeStyle = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 11,
    padding: '5px 10px', borderRadius: 999,
    background: on ? '#EAFBF2' : '#fff', color: on ? '#2F9E67' : '#B4ABCE',
    border: on ? '1px solid #CDEFDD' : '1px solid #EDE7FA',
    transition: 'background .25s ease, color .25s ease, border-color .25s ease',
  });

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#FBFBFE' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* decorative layers */}
      <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ top: -160, right: -120, width: 520, height: 520, background: 'radial-gradient(circle, #DFF5E7 0%, rgba(223,245,231,0) 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(#E7E2F6 1.3px, transparent 1.3px)', backgroundSize: '26px 26px', opacity: 0.4 }} />

      <div className="relative z-[5] mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-8 px-6 pb-10 pt-8 lg:grid-cols-[400px_1fr]">
        {/* ============ controls column ============ */}
        <div className="mvg-rise flex flex-col">
          <Link href="/tools" prefetch={false} className="mvg-btn w-max rounded-md" style={{ fontSize: 12.5, fontWeight: 600, color: '#8B7FC0', textDecoration: 'none' }}>
            ← Free Tools
          </Link>
          <span className="inline-flex w-max items-center gap-[7px] rounded-full" style={{ background: '#EAFBF2', color: '#2F9E67', fontWeight: 600, fontSize: 12.5, padding: '7px 13px', marginTop: 12 }}>
            🌳 Free tool · compound growth
          </span>
          <h1 className="font-display" style={{ fontSize: 34, lineHeight: 1.06, fontWeight: 600, letterSpacing: '-0.6px', margin: '12px 0 0', color: '#1C1F2E' }}>
            Plant coins today.<br />Watch them <span style={{ color: '#2F9E67' }}>grow.</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#6E6A85', margin: '10px 0 0' }}>
            Slide, plant, and press play. Weekly saving plus compound growth turns pocket money into a money tree.
          </p>

          <div className="flex flex-col" style={{ gap: 15, marginTop: 20 }}>
            <SliderRow emoji="🪙" label="Start with" value={money(start)} min={0} max={500} step={10} raw={start} onChange={setStart} />
            <SliderRow emoji="💧" label="Add every week" value={money(weekly)} min={0} max={50} step={1} raw={weekly} onChange={setWeekly} />
            <SliderRow emoji="📅" label="Let it grow for" value={`${years} ${years === 1 ? 'year' : 'years'}`} min={1} max={15} step={1} raw={years} onChange={setYears} />
            <SliderRow emoji="✨" label="Growth rate per year" value={`${rate}%`} min={0} max={12} step={0.5} raw={rate} onChange={setRate} />
          </div>

          {/* inflation toggle */}
          <button
            type="button"
            onClick={() => setInflation((x) => !x)}
            role="switch"
            aria-checked={inflation}
            className="mvg-btn flex w-max cursor-pointer items-center gap-[10px] rounded-full border-0 bg-transparent p-0"
            style={{ marginTop: 16 }}
          >
            <span className="relative block shrink-0 rounded-full" style={{ width: 40, height: 22, background: inflation ? '#6B4EFF' : '#D9D2F0', transition: 'background .25s ease' }}>
              <span className="absolute rounded-full bg-white" style={{ top: 3, left: 3, width: 16, height: 16, boxShadow: '0 2px 5px rgba(40,30,80,.3)', transform: inflation ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .25s ease' }} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#6E6A85' }}>Adjust for inflation (−2.5% / yr)</span>
          </button>

          {/* goal badges */}
          <div className="flex items-center" style={{ gap: 8, marginTop: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8480A0' }}>Goals</span>
            <span style={badgeStyle(finalV >= 1000)}>🌿 $1,000</span>
            <span style={badgeStyle(finalV >= 5000)}>🌳 $5,000</span>
            <span style={badgeStyle(finalV >= 20000)}>🌲 $20,000</span>
          </div>

          {/* actions */}
          <div className="flex" style={{ gap: 10, marginTop: 'auto', paddingTop: 24 }}>
            <button
              type="button"
              onClick={play}
              className="mvg-btn inline-flex flex-1 cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 text-white hover:bg-[#5A3EE6]"
              style={{ background: '#6B4EFF', fontWeight: 600, fontSize: 16, padding: '15px 22px', boxShadow: '0 14px 30px -10px rgba(107,78,255,.7)' }}
            >
              {playing ? '🌱 Growing…' : '▶ Watch it grow'}
            </button>
            <button
              type="button"
              onClick={replant}
              aria-label="Replant — reset the simulation"
              className="mvg-btn inline-flex cursor-pointer items-center justify-center rounded-full bg-white hover:bg-[#F4F1FE]"
              style={{ color: '#5A3EE6', fontWeight: 600, fontSize: 14, padding: '15px 20px', border: '1.5px solid #D9CFF5' }}
            >
              ↺
            </button>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.45, color: '#A8A2C0', marginTop: 12 }}>
            A simulation for learning. Real investing goes up and down — no real money, no advice.
          </div>
        </div>

        {/* ============ tree scene ============ */}
        <div className="mvg-rise relative overflow-hidden" style={{ borderRadius: 26, minHeight: 620, background: 'linear-gradient(180deg, #E9F5FF 0%, #F4FBF3 58%, #E0F5E7 100%)', border: '1px solid #E3EFE6', boxShadow: '0 24px 56px -30px rgba(60,120,80,.45)', animationDelay: '.12s' }}>
          {/* sun + clouds */}
          <div aria-hidden className="mvg-float absolute rounded-full" style={{ top: 34, right: 44, width: 58, height: 58, background: COIN_GRADIENT, boxShadow: '0 6px 18px rgba(243,194,24,.5)' }} />
          <div aria-hidden className="mvg-drift-a absolute rounded-full" style={{ top: 64, left: 64, width: 96, height: 30, background: 'rgba(255,255,255,.85)' }} />
          <div aria-hidden className="mvg-drift-b absolute rounded-full" style={{ top: 120, left: 250, width: 66, height: 22, background: 'rgba(255,255,255,.65)' }} />

          {/* ground */}
          <div aria-hidden className="absolute" style={{ bottom: -90, left: -80, right: -80, height: 240, background: '#6FCF94', borderRadius: '50% 50% 0 0 / 130px 130px 0 0' }} />
          <div aria-hidden className="absolute rounded-full" style={{ bottom: -110, left: 120, width: 420, height: 170, background: '#5DBF83' }} />

          {/* stage chip */}
          <div className="font-display absolute z-[4] rounded-full" style={{ top: 20, left: 20, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', border: '1px solid #E3EFE6', padding: '8px 15px', fontWeight: 600, fontSize: 14, color: '#2F9E67' }}>
            {STAGE_LABELS[stage]}
          </div>

          {/* value card */}
          <div className="absolute z-[4] text-right" style={{ top: 20, right: 20, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)', border: '1px solid #E3EFE6', borderRadius: 18, padding: '12px 18px', boxShadow: '0 12px 28px -14px rgba(60,120,80,.4)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8480A0' }}>Tree value</div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 32, lineHeight: 1.05, color: '#6B4EFF' }}>{money(v)}</div>
            <div style={{ fontSize: 11, color: '#6E6A85', marginTop: 3 }}>Planted {money(contributed)} · ✨ +{money(growth)} grew</div>
          </div>

          {/* tree */}
          <div className="absolute z-[3] flex items-end justify-center" style={{ bottom: 108, left: '50%', transform: 'translateX(-50%)', width: 320, height: 340 }}>
            <div style={{ transform: `scale(${scale.toFixed(3)})`, transformOrigin: 'bottom center' }}>
              <div className="mvg-bob relative" style={{ width: 280, height: 330 }}>
                <div style={{ position: 'absolute', left: 127, bottom: 0, width: 26, height: 130, borderRadius: 12, background: 'linear-gradient(#B07A46, #8B5A2B)' }} />
                <div style={{ position: 'absolute', left: 75, bottom: 158, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%, #7BE3A3, #5FD38D 70%)' }} />
                <div style={{ position: 'absolute', left: 28, bottom: 118, width: 116, height: 116, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%, #6FDD98, #4FC47E 70%)' }} />
                <div style={{ position: 'absolute', left: 162, bottom: 112, width: 124, height: 124, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%, #6FDD98, #4FC47E 70%)' }} />
                {v > 400 && <Coin left={106} bottom={230} size={36} sign />}
                {v > 1200 && <Coin left={58} bottom={168} size={30} sign />}
                {v > 2500 && <Coin left={200} bottom={172} size={32} sign />}
                {v > 6000 && <Coin left={150} bottom={266} size={28} />}
                {v > 12000 && <Coin left={90} bottom={130} size={26} />}
              </div>
            </div>
          </div>

          {/* forest side trees */}
          {stage === 3 && (
            <>
              <SideTree side="left" delay={0} />
              <SideTree side="right" delay={0.15} />
            </>
          )}

          {/* confetti */}
          {celebrating && (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
              {CONFETTI.map((c, i) => (
                <div
                  key={i}
                  className="mvg-confetti-piece absolute"
                  style={{ top: 0, left: c.left, width: c.size, height: c.size, borderRadius: c.round ? '50%' : 3, background: c.color, animation: `mvgConfetti ${c.dur}s linear ${c.delay}s infinite` }}
                />
              ))}
            </div>
          )}

          {/* timeline + share */}
          <div className="absolute z-[6] flex items-center" style={{ bottom: 16, left: 16, right: 16, gap: 16, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', border: '1px solid #E3EFE6', borderRadius: 18, padding: '12px 18px' }}>
            <div className="flex-1">
              <input
                className="mvg-range"
                type="range"
                min={0}
                max={1000}
                step={1}
                value={Math.round(pos * 1000)}
                aria-label="Timeline scrubber"
                onChange={(e) => { stopPlay(); setPos(Number(e.target.value) / 1000); }}
              />
              <div className="flex justify-between" style={{ fontSize: 10.5, fontWeight: 600, color: '#A8A2C0', marginTop: 5 }}>
                <span>Year 0</span>
                <span style={{ color: '#2F9E67' }}>Week {Math.floor(w)} of {totalWeeks}</span>
                <span>Year {years}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={share}
              className="mvg-btn inline-flex shrink-0 cursor-pointer items-center gap-[7px] rounded-full border-0 text-white hover:bg-[#5A3EE6]"
              style={{ background: '#6B4EFF', fontWeight: 600, fontSize: 13, padding: '10px 18px', boxShadow: '0 10px 22px -8px rgba(107,78,255,.6)' }}
            >
              {shared ? 'Copied! 🎉' : 'Share my tree 🔗'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
