'use client';

import dynamic from 'next/dynamic';

const ToolsIndex = dynamic(() => import('./ToolsIndex'), { ssr: false });

export default function ToolsIndexWrapper() {
  return <ToolsIndex />;
}
