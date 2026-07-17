'use client';

import dynamic from 'next/dynamic';

const World = dynamic(() => import('@/app/components/moneytree-world/World'), {
  ssr: false,
  loading: () => null,
});

export default function MoneyTreeWorldPreview() {
  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <World />
    </main>
  );
}
