'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DirectionalLight, AmbientLight, Fog } from 'three';
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Island } from './Island';
import CameraController from './CameraController';
import StarField from './StarField';
import NPCs from './NPCs';
import GLTFModel from './GLTFModel';
import FloatingCards from './FloatingCards';
import Water from './Water';
import SeasonalParticles from './SeasonalParticles';
import { getCurrentSeason } from './Season';

interface SceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  flyIn?: boolean;
  onFlyInComplete?: () => void;
  reducedMotion?: boolean;
  lowPower?: boolean;
}

const DAY_COLOR = new THREE.Color('#87CEEB');
const NIGHT_COLOR = new THREE.Color('#1C1F2E');
const SUNSET_COLOR = new THREE.Color('#6B4EFF');
const SUNRISE_COLOR = new THREE.Color('#FFD84D');

export default function Scene({
  scrollProgressRef,
  mouseRef,
  flyIn = false,
  onFlyInComplete,
  reducedMotion = false,
  lowPower = false,
}: SceneProps) {
  const { scene } = useThree();
  const dirLightRef = useRef<DirectionalLight>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const cycleTimeRef = useRef(0);
  const nightFactorRef = useRef(0);
  const starIntensityRef = useRef(0);

  useEffect(() => {
    scene.fog = new THREE.Fog(DAY_COLOR, 10, 60);
    scene.background = DAY_COLOR.clone();
  }, [scene]);

  useFrame((state, delta) => {
    cycleTimeRef.current += delta;
    const cycle = cycleTimeRef.current % 240;
    const t = cycle / 240;

    let bgColor: THREE.Color;
    let night = 0;
    let intensity = 1;
    let color = new THREE.Color('#ffffff');

    if (t < 0.25) {
      bgColor = DAY_COLOR.clone();
      night = 0;
      intensity = 1;
      color = new THREE.Color('#ffffff');
    } else if (t < 0.45) {
      const local = (t - 0.25) / 0.2;
      bgColor = DAY_COLOR.clone().lerp(SUNSET_COLOR, local);
      night = local * 0.5;
      color = new THREE.Color('#ffffff').lerp(SUNSET_COLOR, local);
      intensity = 1 - local * 0.5;
    } else if (t < 0.55) {
      const local = (t - 0.45) / 0.1;
      bgColor = SUNSET_COLOR.clone().lerp(NIGHT_COLOR, local);
      night = 0.5 + local * 0.5;
      intensity = 0.5 - local * 0.3;
    } else if (t < 0.75) {
      bgColor = NIGHT_COLOR.clone();
      night = 1;
      intensity = 0.2;
      color = new THREE.Color('#5555ff');
    } else {
      const local = (t - 0.75) / 0.25;
      bgColor = NIGHT_COLOR.clone().lerp(DAY_COLOR, local);
      night = 1 - local;
      color = new THREE.Color('#5555ff').lerp(new THREE.Color('#ffffff'), local);
      intensity = 0.2 + local * 0.8;
    }

    scene.background = bgColor;
    if (scene.fog) scene.fog.color = bgColor;

    if (dirLightRef.current) {
      dirLightRef.current.color = color;
      dirLightRef.current.intensity = intensity;
      const angle = t * Math.PI * 2;
      dirLightRef.current.position.set(Math.sin(angle) * 10, Math.cos(angle) * 10 + 2, 5);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.4 + intensity * 0.4;
    }

    nightFactorRef.current = night;
    starIntensityRef.current = night;
  });

  const season = getCurrentSeason();

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight
        ref={dirLightRef}
        position={[10, 10, 5]}
        intensity={1}
        castShadow={!lowPower}
        shadow-mapSize={lowPower ? [512, 512] : [1024, 1024]}
      />
      <Clouds texture="/textures/cloud.png">
        <Cloud position={[-4, 2, -5]} />
        <Cloud position={[4, 3, -4]} />
      </Clouds>
      <StarField visibleIntensityRef={starIntensityRef} />
      <NPCs count={lowPower ? 0 : 8} nightFactorRef={nightFactorRef} lowPower={lowPower} />
      <CameraController
        scrollProgressRef={scrollProgressRef}
        mouseRef={mouseRef}
        flyIn={flyIn}
        onFlyInComplete={onFlyInComplete}
        reducedMotion={reducedMotion}
      />
      <GLTFModel
        fallback={
          <Island
            scrollProgressRef={scrollProgressRef}
            mouseRef={mouseRef}
            lowPower={lowPower}
            nightFactorRef={nightFactorRef}
          />
        }
        reducedMotion={reducedMotion}
        lowPower={lowPower}
        mouseRef={mouseRef}
      />
      <FloatingCards scrollProgressRef={scrollProgressRef} />
      <Water season={season} lowPower={lowPower} />
      <SeasonalParticles season={season} lowPower={lowPower} nightFactorRef={nightFactorRef} />
    </>
  );
}
