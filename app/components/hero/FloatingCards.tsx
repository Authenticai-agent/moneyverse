'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingCardsProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

export default function FloatingCards({ scrollProgressRef }: FloatingCardsProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(time * 1.5 + i) * 0.0005;
    });
  });

  const progress = scrollProgressRef.current;
  const cards: { label: string; value: string; pos: [number, number, number]; show: boolean }[] = [
    { label: 'Savings Goal', value: '$120 saved', pos: [-2.5, 1.5, 0.5], show: progress > 0.15 },
    { label: 'Weekly Budget', value: '$20 / week', pos: [2.5, 1.8, 0], show: progress > 0.3 },
    { label: 'Money Tree Growth', value: '+12%', pos: [-1.5, 2.2, 1.5], show: progress > 0.45 },
    { label: 'Business Profit', value: '$15 today', pos: [1.5, 2.4, -1.5], show: progress > 0.6 },
    { label: 'XP Earned', value: '50 XP', pos: [0, 2.6, 2], show: progress > 0.75 },
  ];

  return (
    <group ref={groupRef}>
      {cards.map((card, i) => (
        card.show && (
          <Html key={i} position={card.pos} center distanceFactor={10}>
            <div aria-hidden="true" className="pointer-events-none select-none rounded-xl bg-white/80 backdrop-blur-md border border-white/40 px-3 py-2 shadow-md text-mv-dark text-center">
              <p className="text-xs font-semibold text-mv-primary">{card.label}</p>
              <p className="text-sm font-bold">{card.value}</p>
            </div>
          </Html>
        )
      ))}
    </group>
  );
}
