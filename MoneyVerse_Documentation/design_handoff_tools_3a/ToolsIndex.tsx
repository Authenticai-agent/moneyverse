'use client';

/**
 * ToolsIndex — "Explore MoneyVerse" free-tools grid (design 3a)
 * -------------------------------------------------------------
 * Client component for the /tools route. Same visual language as MoneyVerseHero (design 2a).
 * Stack: Next 15 App Router · React 19 · Tailwind 3.4 (`mv` tokens) · next/font (Fredoka/Inter).
 * No new dependencies (emoji icons, CSS keyframe animations).
 *
 * Usage: keep `app/tools/page.tsx` as the server component that owns `metadata`,
 * and render <ToolsIndex /> from it (see README).
 */

import Link from 'next/link';

/* ---------------- keyframes + hover (injected once) ---------------- */
const STYLES = `
@keyframes mvtRise { 0% { transform: translateY(26px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes mvtPop  { 0% { transform: scale(0); opacity: 0; } 68% { transform: scale(1.14); } 100% { transform: scale(1); opacity: 1; } }
@keyframes mvtDraw { to { stroke-dashoffset: 0; } }
@keyframes mvtGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes mvtRingSm { to { stroke-dashoffset: 30; } }
@keyframes mvtRadar { to { width: 92%; } }

.mvt-rise { animation: mvtRise .6s cubic-bezier(.2,.9,.3,1) both; }
.mvt-pop { animation: mvtPop .5s cubic-bezier(.2,1.3,.4,1) both; opacity: 0; }
.mvt-draw { animation: mvtDraw 1.3s ease .5s forwards; }
.mvt-growx { transform-origin: left; animation: mvtGrowX .7s cubic-bezier(.3,.9,.3,1) both; }
.mvt-ring { animation: mvtRingSm 1.2s cubic-bezier(.3,.9,.3,1) .4s forwards; }
.mvt-radar { width: 0; animation: mvtRadar 1.2s cubic-bezier(.3,.9,.3,1) .4s forwards; }

.mvt-card { transition: transform .25s ease, box-shadow .25s ease; }
.mvt-card:hover { transform: translateY(-6px); box-shadow: 0 32px 60px -26px rgba(80,60,150,.55) !important; }
.mvt-card:focus-visible { outline: 2px solid #6B4EFF; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .mvt-rise, .mvt-pop, .mvt-draw, .mvt-growx, .mvt-ring, .mvt-radar { animation: none !important; }
  .mvt-pop { opacity: 1; }
  .mvt-draw { stroke-dashoffset: 0 !important; }
  .mvt-radar { width: 92%; }
  .mvt-card:hover { transform: none; }
}
`;

/* ---------------- shared styles ---------------- */
const VIZ_TILE: React.CSSProperties = {
  height: 56,
  background: '#FAF9FE',
  border: '1px solid #F0ECFA',
  borderRadius: 14,
};

/* ---------------- per-tool micro-visuals ---------------- */
function VizCurve() {
  return (
    <div style={VIZ_TILE} className="flex items-center gap-2.5 px-3 py-2">
      <svg width="100%" height="38" viewBox="0 0 150 38" preserveAspectRatio="none" className="block flex-1">
        <path className="mvt-draw" d="M4,34 C36,32 56,28 82,20 C108,12 128,8 146,3" fill="none" stroke="#2F9E67" strokeWidth="3" strokeLinecap="round" strokeDasharray="170" strokeDashoffset="170" />
      </svg>
      <div className="text-right">
        <div className="font-display text-[15px] font-bold leading-none" style={{ color: '#2F9E67' }}>$148</div>
        <div className="mt-px text-[9.5px] text-[#A8A2C0]">by week 12</div>
      </div>
    </div>
  );
}

function VizRing() {
  return (
    <div style={VIZ_TILE} className="flex items-center gap-[11px] px-3 py-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
        <circle cx="20" cy="20" r="15" stroke="#EDE7F8" strokeWidth="5" fill="none" />
        <circle className="mvt-ring" cx="20" cy="20" r="15" stroke="#6B4EFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="94.2" transform="rotate(-90 20 20)" />
      </svg>
      <div>
        <div className="font-display text-[15px] font-bold leading-none text-mv-dark">$68 saved</div>
        <div className="mt-0.5 text-[9.5px] text-[#A8A2C0]">of a $100 goal · 4 wks left</div>
      </div>
    </div>
  );
}

function VizSplit() {
  const segs = [
    { w: '40%', c: '#6B4EFF', d: '.35s' },
    { w: '30%', c: '#5FD38D', d: '.5s' },
    { w: '10%', c: '#FFD84D', d: '.65s' },
    { w: '20%', c: '#5CE1E6', d: '.8s' },
  ];
  return (
    <div style={VIZ_TILE} className="flex flex-col justify-center gap-1.5 px-3 py-2.5">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {segs.map((s) => (
          <div key={s.c} className="mvt-growx" style={{ width: s.w, background: s.c, animationDelay: s.d }} />
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-semibold text-[#A8A2C0]">
        <span>Spend</span><span>Save</span><span>Give</span><span>Goals</span>
      </div>
    </div>
  );
}

function VizChips() {
  return (
    <div style={VIZ_TILE} className="flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-2">
      <span className="mvt-pop rounded-full bg-white px-2 py-[5px] text-[10.5px] font-semibold text-[#6E6A85]" style={{ border: '1px solid #EDE7FA', animationDelay: '.35s' }}>Cost $0.50</span>
      <span className="text-[11px] text-[#A8A2C0]">→</span>
      <span className="mvt-pop rounded-full px-2 py-[5px] text-[10.5px] font-bold" style={{ background: '#FFF3CF', color: '#A9760A', animationDelay: '.55s' }}>Price $1.50</span>
      <span className="mvt-pop rounded-full px-2 py-[5px] text-[10.5px] font-bold" style={{ background: '#EAFBF2', color: '#2F9E67', animationDelay: '.8s' }}>+$1.00 profit</span>
    </div>
  );
}

function VizPath() {
  return (
    <div style={VIZ_TILE} className="flex items-center px-3.5 py-2">
      <div className="mvt-pop flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: '#FFF3CF', animationDelay: '.3s' }}>🍋</div>
      <div className="mvt-growx mx-[5px] h-[3px] flex-1 rounded-full" style={{ background: '#6B4EFF', animationDelay: '.5s' }} />
      <div className="mvt-pop flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: '#EDE6FF', animationDelay: '.75s' }}>🧁</div>
      <div className="mx-[5px] h-[3px] flex-1 rounded-full" style={{ background: '#EDE7F8' }} />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm opacity-50" style={{ background: '#F1EEF9' }}>🏪</div>
    </div>
  );
}

function VizQuests() {
  return (
    <div style={VIZ_TILE} className="flex items-center gap-[7px] px-3 py-2">
      <span className="mvt-pop flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] text-white" style={{ background: '#2F9E67', animationDelay: '.35s' }}>✓</span>
      <span className="mvt-pop flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] text-white" style={{ background: '#2F9E67', animationDelay: '.5s' }}>✓</span>
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs text-[#8B7FC0]" style={{ border: '1.5px dashed #C9BFE8' }}>＋</span>
      <span className="mvt-pop ml-auto rounded-full px-2.5 py-[5px] text-[11px] font-bold" style={{ background: '#FFF3CF', color: '#A9760A', animationDelay: '.7s' }}>🔥 6 day streak</span>
    </div>
  );
}

function VizRadar() {
  return (
    <div style={VIZ_TILE} className="flex flex-col justify-center gap-1.5 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold text-[#413B5A]">Scam radar</span>
        <span className="text-[10.5px] font-bold" style={{ color: '#2FB8BE' }}>Sharp 🔍</span>
      </div>
      <div className="h-[9px] overflow-hidden rounded-full" style={{ background: '#EDE7F8' }}>
        <div className="mvt-radar h-full rounded-full" style={{ background: 'linear-gradient(90deg,#5CE1E6,#2FB8BE)' }} />
      </div>
    </div>
  );
}

function VizShareCard() {
  return (
    <div style={VIZ_TILE} className="flex items-center gap-2.5 px-3 py-2">
      <div className="mvt-pop flex h-[38px] w-[56px] shrink-0 items-center justify-center rounded-lg text-[17px]" style={{ background: 'linear-gradient(135deg,#8B74FF,#6B4EFF)', boxShadow: '0 6px 14px -6px rgba(107,78,255,.6)', animationDelay: '.35s' }}>🏆</div>
      <div>
        <div className="flex gap-0.5 text-[11px]">
          <span className="mvt-pop" style={{ animationDelay: '.5s' }}>⭐</span>
          <span className="mvt-pop" style={{ animationDelay: '.62s' }}>⭐</span>
          <span className="mvt-pop" style={{ animationDelay: '.74s' }}>⭐</span>
        </div>
        <div className="mt-[3px] text-[9.5px] text-[#A8A2C0]">Parent-approved sharing</div>
      </div>
    </div>
  );
}

/* ---------------- tool data (routes match app/tools/*) ---------------- */
type Tool = {
  href: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  tag: { label: string; bg: string; color: string };
  cta: string;
  viz: () => React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    href: '/tools/money-tree-calculator',
    title: 'Money Tree Simulator',
    description: 'See how weekly savings grow with compound interest.',
    emoji: '🌳',
    gradient: 'radial-gradient(circle at 34% 28%,#7BE3A3,#4FC47E)',
    tag: { label: 'SIMULATOR', bg: '#EAFBF2', color: '#2F9E67' },
    cta: 'Plant yours',
    viz: VizCurve,
  },
  {
    href: '/tools/savings-goal-calculator',
    title: 'Savings Goal Calculator',
    description: 'Plan how long it will take to save for a goal.',
    emoji: '🎯',
    gradient: 'radial-gradient(circle at 34% 28%,#8B74FF,#6B4EFF)',
    tag: { label: 'CALCULATOR', bg: '#EDE6FF', color: '#5A3EE6' },
    cta: 'Plan a goal',
    viz: VizRing,
  },
  {
    href: '/tools/kids-budget-calculator',
    title: 'Kids Budget Calculator',
    description: 'Learn to split money into Spend, Save, Give, and Goals.',
    emoji: '🪙',
    gradient: 'radial-gradient(circle at 34% 28%,#7FE9EE,#2FB8BE)',
    tag: { label: 'CALCULATOR', bg: '#E4F9FA', color: '#127C82' },
    cta: 'Split it up',
    viz: VizSplit,
  },
  {
    href: '/tools/lemonade-stand-profit-game',
    title: 'Lemonade Stand Profit Game',
    description: 'Set prices, buy ingredients, and learn profit and revenue.',
    emoji: '🍋',
    gradient: 'radial-gradient(circle at 34% 28%,#FFE29A,#FFB74D)',
    tag: { label: 'GAME', bg: '#FFF3CF', color: '#A9760A' },
    cta: 'Open your stand',
    viz: VizChips,
  },
  {
    href: '/tools/business-simulator',
    title: 'Business Simulator',
    description: 'Grow a lemonade stand into a bakery while learning business basics.',
    emoji: '🏢',
    gradient: 'radial-gradient(circle at 34% 28%,#8B74FF,#6B4EFF)',
    tag: { label: 'GAME', bg: '#EDE6FF', color: '#5A3EE6' },
    cta: 'Start building',
    viz: VizPath,
  },
  {
    href: '/tools/daily-money-quests',
    title: 'Daily Money Quests',
    description: 'Practice needs vs wants, scam spotting, and budgeting.',
    emoji: '⚡',
    gradient: 'radial-gradient(circle at 34% 28%,#7BE3A3,#4FC47E)',
    tag: { label: 'QUESTS', bg: '#EAFBF2', color: '#2F9E67' },
    cta: "Today's quest",
    viz: VizQuests,
  },
  {
    href: '/tools/scam-shield-quiz',
    title: 'Scam Shield Quiz',
    description: 'Learn to spot phishing, fake giveaways, and online scams.',
    emoji: '🛡️',
    gradient: 'radial-gradient(circle at 34% 28%,#7FE9EE,#2FB8BE)',
    tag: { label: 'QUIZ', bg: '#E4F9FA', color: '#127C82' },
    cta: 'Test your radar',
    viz: VizRadar,
  },
  {
    href: '/tools/achievement-cards',
    title: 'Achievement Cards',
    description: 'Create safe, shareable cards that celebrate money skills.',
    emoji: '🏆',
    gradient: 'radial-gradient(circle at 34% 28%,#FFE29A,#FFB74D)',
    tag: { label: 'CREATOR', bg: '#FFF3CF', color: '#A9760A' },
    cta: 'Make a card',
    viz: VizShareCard,
  },
];

/* ---------------- page ---------------- */
export default function ToolsIndex() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFBFE]">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* decorative background */}
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full" style={{ background: 'radial-gradient(circle,#EDE7FF 0%,rgba(237,231,255,0) 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-36 -left-24 h-[420px] w-[420px] rounded-full" style={{ background: 'radial-gradient(circle,#E4F9FA 0%,rgba(228,249,250,0) 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(#E7E2F6 1.3px, transparent 1.3px)', backgroundSize: '26px 26px', opacity: 0.45 }} />

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        {/* header */}
        <span className="mvt-rise inline-flex items-center gap-2 rounded-full px-[15px] py-2 text-[13px] font-semibold" style={{ background: '#EDE6FF', color: '#5A3EE6' }}>
          🧰 8 free tools · no sign-up needed
        </span>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="mvt-rise mt-4 font-display text-[36px] font-semibold leading-[1.04] tracking-[-.8px] text-mv-dark sm:text-[44px]" style={{ animationDelay: '.06s' }}>
              Explore <span className="text-mv-primary">MoneyVerse.</span>
            </h1>
            <p className="mvt-rise mt-3 max-w-[560px] text-[16.5px] leading-normal text-[#4A4560]" style={{ animationDelay: '.12s' }}>
              Free, safe money tools and games built for kids, families, and classrooms. No bank connection required.
            </p>
          </div>
          <div className="mvt-rise flex gap-2 pb-1.5" style={{ animationDelay: '.18s' }}>
            <span className="rounded-xl bg-white px-[13px] py-2 text-[12.5px] font-semibold text-[#413B5A]" style={{ border: '1.5px solid #EDE7FA' }}>🚫 No ads</span>
            <span className="rounded-xl bg-white px-[13px] py-2 text-[12.5px] font-semibold text-[#413B5A]" style={{ border: '1.5px solid #EDE7FA' }}>🔒 Kid-safe</span>
          </div>
        </div>

        {/* card grid */}
        <ul className="mt-7 grid list-none grid-cols-1 gap-[18px] p-0 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool, i) => (
            <li key={tool.href} className="flex">
              <Link
                prefetch={false}
                href={tool.href}
                className="mvt-card mvt-rise flex w-full flex-col gap-[11px] p-[18px] no-underline"
                style={{
                  background: 'rgba(255,255,255,.94)',
                  border: '1px solid #ECE7FB',
                  borderRadius: 22,
                  boxShadow: '0 18px 40px -24px rgba(80,60,150,.35)',
                  animationDelay: `${0.1 + i * 0.07}s`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full text-[22px]" style={{ background: tool.gradient }}>{tool.emoji}</div>
                  <span className="rounded-full px-[9px] py-1 text-[10px] font-bold tracking-[.4px]" style={{ background: tool.tag.bg, color: tool.tag.color }}>{tool.tag.label}</span>
                </div>
                <div>
                  <h2 className="font-display text-[16.5px] font-semibold leading-snug text-mv-dark">{tool.title}</h2>
                  <p className="mt-1 text-[12.5px] leading-[1.45] text-[#6E6A85]">{tool.description}</p>
                </div>
                <tool.viz />
                <div className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold text-mv-primary">
                  {tool.cta} <span className="text-[15px]">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
