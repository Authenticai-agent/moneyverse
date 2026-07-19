'use client';

/**
 * Goal Jar - 2D jar
 * ------------------
 * Pure SVG. This is not a degraded experience, it is the guaranteed one: it
 * serves reduced-motion, no-WebGL, the moment before the 3D chunk loads, and a
 * thrown error inside the canvas. Every number it shows is the same number the
 * 3D scene shows, because both take identical props.
 *
 * Three etched rings at 25/50/75 and a lid line at 100%, matching the 3D glass.
 * The ghost line marks where the savings are *now* while the scrubber is out in
 * the future.
 */

import { memo } from 'react';
import { TEXT } from './chrome';

interface PlaceholderJarProps {
  /** Fill fraction at the scrubbed week, 0..1. */
  progress: number;
  /** Fill fraction right now. Drawn as a dashed ghost when scrubbing. */
  nowProgress: number;
  /** Whether the scrubber has moved off "now". */
  showGhost: boolean;
  /** Pins the fill transition to its final state. */
  reduced: boolean;
  /** Accessible summary; the SVG itself is decorative. */
  label: string;
}

/* Jar geometry, in the 200x260 viewBox. */
const JAR_TOP = 52;
const JAR_BOTTOM = 236;
const JAR_LEFT = 30;
const JAR_RIGHT = 170;
const JAR_H = JAR_BOTTOM - JAR_TOP;

/** y coordinate for a fill fraction, measured from the bottom of the jar. */
const yFor = (f: number) => JAR_BOTTOM - JAR_H * Math.min(1, Math.max(0, f));

function Ring({ fraction }: { fraction: number }) {
  const y = yFor(fraction);
  return (
    <line
      x1={JAR_LEFT + 6}
      x2={JAR_RIGHT - 6}
      y1={y}
      y2={y}
      stroke="#C9BFE8"
      strokeWidth={1.5}
      strokeDasharray="3 4"
      opacity={0.7}
    />
  );
}

function PlaceholderJarImpl({ progress, nowProgress, showGhost, reduced, label }: PlaceholderJarProps) {
  const ghostY = yFor(nowProgress);

  return (
    <div className="sgj-jar-wrap relative mx-auto w-full">
      <svg
        viewBox="0 0 200 260"
        className="block w-full"
        role="img"
        aria-label={label}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Clip so the fill takes the jar's rounded shape, not a bare rect. */}
          <clipPath id="sgj-jar-clip">
            <rect x={JAR_LEFT} y={JAR_TOP} width={JAR_RIGHT - JAR_LEFT} height={JAR_H} rx={30} />
          </clipPath>
          <linearGradient id="sgj-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD84D" />
            <stop offset="100%" stopColor="#F5B301" />
          </linearGradient>
          <linearGradient id="sgj-glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#D9CFFF" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* lid */}
        <rect x={JAR_LEFT + 12} y={30} width={JAR_RIGHT - JAR_LEFT - 24} height={20} rx={9} fill="#D9CFFF" />
        <rect x={JAR_LEFT + 20} y={34} width={JAR_RIGHT - JAR_LEFT - 40} height={5} rx={2.5} fill="#EDE6FF" />

        <g clipPath="url(#sgj-jar-clip)">
          {/* glass body */}
          <rect x={JAR_LEFT} y={JAR_TOP} width={JAR_RIGHT - JAR_LEFT} height={JAR_H} fill="#FAF9FE" />

          {/* The coins. Scaled from the jar's base rather than animating the
              `y`/`height` attributes - SVG geometry attributes do not
              transition reliably across browsers, but transforms do. */}
          <rect
            x={JAR_LEFT}
            y={JAR_TOP}
            width={JAR_RIGHT - JAR_LEFT}
            height={JAR_H}
            fill="url(#sgj-fill)"
            style={{
              transform: `scaleY(${Math.min(1, Math.max(0, progress))})`,
              transformOrigin: `0px ${JAR_BOTTOM}px`,
              transition: reduced ? 'none' : 'transform 600ms cubic-bezier(.2,.9,.3,1)',
            }}
          />

          {/* A soft crest so the fill reads as loose coins, not liquid. */}
          {progress > 0 && (
            <ellipse
              cx={100}
              cy={JAR_BOTTOM}
              rx={(JAR_RIGHT - JAR_LEFT) / 2}
              ry={6}
              fill="#FFE9A6"
              style={{
                transform: `translateY(${-JAR_H * Math.min(1, Math.max(0, progress))}px)`,
                transition: reduced ? 'none' : 'transform 600ms cubic-bezier(.2,.9,.3,1)',
              }}
            />
          )}

          {/* etched rings */}
          <Ring fraction={0.25} />
          <Ring fraction={0.5} />
          <Ring fraction={0.75} />

          {/* ghost line: where the savings actually are today */}
          {showGhost && (
            <g style={{ transition: reduced ? 'none' : 'opacity 250ms' }}>
              <line
                x1={JAR_LEFT}
                x2={JAR_RIGHT}
                y1={ghostY}
                y2={ghostY}
                stroke="#6B4EFF"
                strokeWidth={2}
                strokeDasharray="6 5"
              />
            </g>
          )}

          {/* glass sheen over everything inside */}
          <rect x={JAR_LEFT} y={JAR_TOP} width={JAR_RIGHT - JAR_LEFT} height={JAR_H} fill="url(#sgj-glass)" />
        </g>

        {/* jar outline, drawn last so it sits above the fill */}
        <rect
          x={JAR_LEFT}
          y={JAR_TOP}
          width={JAR_RIGHT - JAR_LEFT}
          height={JAR_H}
          rx={30}
          fill="none"
          stroke="#C9BFE8"
          strokeWidth={2.5}
        />

        {/* lid line at 100% */}
        <line
          x1={JAR_LEFT}
          x2={JAR_RIGHT}
          y1={JAR_TOP + 2}
          y2={JAR_TOP + 2}
          stroke="#8B7FC0"
          strokeWidth={2}
        />
      </svg>

      {/*
        The "% full" readout deliberately does NOT live here.

        It is rendered by the orchestrator instead, so it appears exactly once
        whether the jar on screen is this SVG or the 3D canvas. Keeping it here
        would mean it vanished the moment WebGL was available - and it is the
        text equivalent of the fill level, which `design.md` requires to exist
        independently of anything visual.
      */}
    </div>
  );
}

export default memo(PlaceholderJarImpl);
