'use client';

import { useState, useEffect } from 'react';

export function useResolvedParams<T extends Record<string, string>>(params: Promise<T>): T | null {
  const [resolved, setResolved] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    params.then((value) => {
      if (active) setResolved(value);
    });
    return () => {
      active = false;
    };
  }, [params]);

  return resolved;
}
