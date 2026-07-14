'use client';

/** Confetti - a short celebratory burst, shown when the tree reaches a new stage. */

const PIECES: Array<{ left: string; size: number; round: boolean; color: string; dur: number; delay: number }> = [
  { left: '8%', size: 12, round: false, color: '#6B4EFF', dur: 1.6, delay: 0 },
  { left: '20%', size: 10, round: true, color: '#FFD84D', dur: 1.9, delay: 0.1 },
  { left: '32%', size: 11, round: false, color: '#5CE1E6', dur: 1.7, delay: 0.2 },
  { left: '44%', size: 12, round: true, color: '#5FD38D', dur: 2.0, delay: 0.05 },
  { left: '56%', size: 10, round: false, color: '#FF8FB1', dur: 1.8, delay: 0.25 },
  { left: '68%', size: 12, round: false, color: '#FFD84D', dur: 1.6, delay: 0.15 },
  { left: '78%', size: 9, round: true, color: '#6B4EFF', dur: 2.1, delay: 0.3 },
  { left: '90%', size: 11, round: true, color: '#5CE1E6', dur: 1.75, delay: 0.08 },
];

export default function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[8] overflow-hidden">
      {PIECES.map((p, i) => (
        <div
          key={i}
          className="mtg-confetti-piece"
          style={{
            position: 'absolute', top: 0, left: p.left, width: p.size, height: p.size,
            borderRadius: p.round ? '50%' : 3, background: p.color,
            animation: `mtgConfettiFall ${p.dur}s ease-in ${p.delay}s 1`,
          }}
        />
      ))}
    </div>
  );
}
