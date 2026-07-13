'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import HeroFallback from './HeroFallback';

const Scene = dynamic(() => import('./hero/Scene'), { ssr: false });

export interface InteractiveHeroProps {
  flyIn?: boolean;
  onFlyInComplete?: () => void;
}

function detectWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function detectReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function detectLowPower() {
  if (typeof window === 'undefined') return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 2;
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.innerWidth < 768;
  return mobile && smallScreen && (memory ? memory <= 4 : cores <= 4);
}

export default function InteractiveHero({ flyIn = false, onFlyInComplete }: InteractiveHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [useFallback, setUseFallback] = useState(true);
  const [lowPower, setLowPower] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollProgressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const reduced = detectReducedMotion();
    setReducedMotion(reduced);
    setLowPower(detectLowPower());
    setUseFallback(reduced || !detectWebGL());

    const updateScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollProgressRef.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const updateMouse = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      mouseRef.current = {
        x: (clientX / window.innerWidth) * 2 - 1,
        y: -(clientY / window.innerHeight) * 2 + 1,
      };
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('touchmove', updateMouse, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      window.removeEventListener('mousemove', updateMouse);
      window.removeEventListener('touchmove', updateMouse);
    };
  }, []);

  if (!mounted || useFallback) {
    return <HeroFallback />;
  }

  return (
    <div className="h-[60vh] w-full" role="img" aria-label="Interactive 3D MoneyVerse island">
      <Suspense fallback={<div className="h-full w-full bg-mv-light" />}>
        <Canvas
          shadows={!lowPower}
          camera={{ position: [0, 4, 8], fov: 45 }}
          dpr={lowPower ? 1 : [1, 2]}
        >
          <Scene
            scrollProgressRef={scrollProgressRef}
            mouseRef={mouseRef}
            flyIn={flyIn}
            onFlyInComplete={onFlyInComplete}
            reducedMotion={reducedMotion}
            lowPower={lowPower}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
