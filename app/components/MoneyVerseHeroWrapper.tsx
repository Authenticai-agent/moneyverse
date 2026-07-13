'use client';

import dynamic from 'next/dynamic';

const MoneyVerseHero = dynamic(() => import('./MoneyVerseHero'), { ssr: false });

export default function MoneyVerseHeroWrapper() {
  return <MoneyVerseHero />;
}
