type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();

export function rateLimit(args: {
  key: string;
  maxRequests: number;
  windowSeconds: number;
  now?: number;
}): { allowed: boolean; retryAfterSeconds: number } {
  const now = args.now ?? Date.now();
  const windowMs = args.windowSeconds * 1000;
  const existing = store.get(args.key);

  if (!existing || now - existing.windowStart >= windowMs) {
    store.set(args.key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count < args.maxRequests) {
    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfter = Math.ceil((existing.windowStart + windowMs - now) / 1000);
  return { allowed: false, retryAfterSeconds: retryAfter };
}

export function resetRateLimit(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}

export function globalRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const maxRequests = Number(process.env.GLOBAL_REQUEST_LIMIT_PER_IP || '200');
  return rateLimit({ key: `global:${ip}`, maxRequests, windowSeconds: 60 });
}

export function dailyQuotaLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const maxRequests = Number(process.env.DAILY_REQUEST_LIMIT_PER_IP || '1000');
  return rateLimit({ key: `daily:${ip}`, maxRequests, windowSeconds: 24 * 60 * 60 });
}
