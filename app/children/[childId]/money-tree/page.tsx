'use client';

import ChildMoneyTree from '@/app/components/ChildMoneyTree';
import { useResolvedParams } from '@/lib/useResolvedParams';

export default function MoneyTreePage({ params }: { params: Promise<{ childId: string }> }) {
  const resolved = useResolvedParams(params);
  if (!resolved) return null;

  return (
    <main className="min-h-screen bg-mv-light p-6">
      <ChildMoneyTree childId={resolved.childId} />
    </main>
  );
}
