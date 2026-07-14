'use client';

import dynamic from 'next/dynamic';

const MoneyTreeGame = dynamic(() => import('./MoneyTreeGame'), { ssr: false });

export default function MoneyTreeGameWrapper() {
  return <MoneyTreeGame />;
}
