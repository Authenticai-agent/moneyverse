'use client';

/**
 * Goal Jar - shared surfaces and icons
 * -------------------------------------
 * Small shared pieces so the same clay surface and the same icon set are not
 * re-declared in nine components.
 *
 * Icons are hand-written inline SVG paths, not a package and not emoji. Per the
 * resolution recorded in `design-system/moneyverse-savings-goal/pages/
 * savings-goal-calculator.md`: if tapping it does something, it is SVG; if it
 * is decoration, it may be emoji (always `aria-hidden` beside a text label).
 *
 * Surfaces follow the 3a handoff exactly - radius 22px, `1px #ECE7FB`, and the
 * measured shadow. Claymorphism contributes the second shadow layer and the
 * squish-on-press, expressed in `mv` colors at 3a's radii.
 */

import type { CSSProperties, ReactNode } from 'react';

/* -------------------------------- surfaces -------------------------------- */

/** The 3a card shell. Used for every panel on the page. */
export const CARD: CSSProperties = {
  background: 'rgba(255,255,255,.94)',
  border: '1px solid #ECE7FB',
  borderRadius: 22,
  boxShadow: '0 18px 40px -24px rgba(80,60,150,.35)',
};

/** The toy surfaces - jar chrome, preset tiles - go rounder, per the resolution. */
export const CLAY: CSSProperties = {
  background: 'rgba(255,255,255,.94)',
  border: '1px solid #ECE7FB',
  borderRadius: 28,
  // Two layers: the 3a shadow, plus an inner highlight that reads as moulded.
  boxShadow: '0 18px 40px -24px rgba(80,60,150,.35), inset 0 2px 0 rgba(255,255,255,.9)',
};

/** The inset tile the 3a cards use for their micro-visuals. */
export const TILE: CSSProperties = {
  background: '#FAF9FE',
  border: '1px solid #F0ECFA',
  borderRadius: 14,
};

/**
 * Text ramp, derived from the 3a handoff. Every value here is used for **text**
 * and every one clears 4.5:1 against the `#F8F8FF` page and the near-white
 * cards.
 *
 * `faint` deliberately departs from 3a's `#A8A2C0`, which measures 2.31:1 and
 * fails. The handoff uses that value on 9.5px micro-labels inside a decorative
 * tile; here the same ramp position carries real informational text ("was 18
 * weeks", "Tap to add", the scrubber end labels), so it had to be darkened to
 * `#716D8A` (4.67:1). `#A8A2C0` is still fine for non-text - it is the jar's
 * etched-ring stroke.
 *
 * `success` likewise darkens 3a's `#2F9E67` (3.20:1, a curve *stroke* colour in
 * the handoff) to `#1F7A4C` (5.03:1) for use as text.
 */
export const TEXT = {
  body: '#4A4560',
  strong: '#413B5A',
  muted: '#6E6A85',
  faint: '#716D8A',
  success: '#1F7A4C',
} as const;

/* ---------------------------------- icons --------------------------------- */

interface IconProps {
  /** Icons are always decorative here - the button carries the accessible name. */
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false as const,
});

export function IconPlus({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconPrint({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 9V3h10v6M7 19H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M7 15h10v6H7z" />
    </svg>
  );
}

export function IconShare({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3v13M8 7l4-4 4 4" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export function IconSoundOn({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

export function IconSoundOff({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 9.5l4 5M21 9.5l-4 5" />
    </svg>
  );
}

export function IconBack({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconReset({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function IconCheck({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function IconClose({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* -------------------------------- helpers --------------------------------- */

/** Text only visible to screen readers. Tailwind has no `sr-only` plugin here. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}
