'use client';

/**
 * MoodLighting - the ambient/hemisphere fill, but reactive: it eases toward a
 * warmer, brighter tone on a good year and a cooler, dimmer one on a bad
 * year, so the whole garden's mood shifts with the portfolio, not just the
 * tree's canopy tint. The single shadow-casting directional "sun" stays in
 * World.tsx; this only drives the soft fill.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type WorldMood } from './useWorldStore';

type Look = { sky: THREE.Color; ground: THREE.Color; hemi: number; ambient: THREE.Color; ambientI: number };

const LOOKS: Record<WorldMood, Look> = {
  neutral: {
    sky: new THREE.Color('#FFEFD6'),
    ground: new THREE.Color('#4B7A52'),
    hemi: 0.65,
    ambient: new THREE.Color('#FFF3E0'),
    ambientI: 0.32,
  },
  good: {
    sky: new THREE.Color('#FFF6DE'),
    ground: new THREE.Color('#5E9060'),
    hemi: 0.85,
    ambient: new THREE.Color('#FFF0CE'),
    ambientI: 0.42,
  },
  bad: {
    sky: new THREE.Color('#D9E2F0'),
    ground: new THREE.Color('#4A6668'),
    hemi: 0.5,
    ambient: new THREE.Color('#DCE4F2'),
    ambientI: 0.24,
  },
};

export function MoodLighting() {
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    const { mood } = useWorldStore.getState();
    const look = LOOKS[mood];
    const k = Math.min(1, delta * 1.5);
    const hemi = hemiRef.current;
    if (hemi) {
      hemi.color.lerp(look.sky, k);
      hemi.groundColor.lerp(look.ground, k);
      hemi.intensity += (look.hemi - hemi.intensity) * k;
    }
    const ambient = ambientRef.current;
    if (ambient) {
      ambient.color.lerp(look.ambient, k);
      ambient.intensity += (look.ambientI - ambient.intensity) * k;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#FFEFD6', '#4B7A52', 0.65]} />
      <ambientLight ref={ambientRef} args={['#FFF3E0', 0.32]} />
    </>
  );
}
