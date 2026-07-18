'use client';

/**
 * Quality tiering for the garden. Phones - especially mid-range Androids, our
 * 9-14 audience's most common device - can't hold 60fps with the desktop
 * settings (thousands of CPU-animated grass blades, a 2048 shadow map, a
 * retina pixel ratio). detectQualityTier() picks 'low' for touch / small /
 * few-core devices so World can dial those back; 'high' keeps the full look
 * on a desktop.
 *
 * Read once at mount (the world is a client-only dynamic import, so `window`
 * exists on first render) - the tier doesn't need to react to live resizes,
 * only to what device we're on.
 */

import { useState } from 'react';

export type QualityTier = 'high' | 'low';

export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  // A phone's SMALLER dimension is ~375-430 in either orientation, so a <540
  // min-dimension reliably means "phone" without catching compact laptop
  // windows (e.g. 1280x720, whose min is 720).
  const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const phoneSized = Math.min(window.innerWidth, window.innerHeight) < 540;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarsePointer || phoneSized || fewCores ? 'low' : 'high';
}

export function useQualityTier(): QualityTier {
  const [tier] = useState<QualityTier>(() => detectQualityTier());
  return tier;
}
