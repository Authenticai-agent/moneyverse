const store = new Map<string, { spend: number; windowStart: number }>();

export function resetBillingBudget(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}

export function checkBillingBudget(args: { cost: number; key?: string; alertThreshold?: number; limit?: number }): {
  allowed: boolean;
  alert: boolean;
  currentSpend: number;
} {
  const key = args.key ?? 'default';
  const limit = args.limit ?? (Number(process.env.BILLING_LIMIT || '0') || undefined);
  const alertThreshold =
    args.alertThreshold ?? (Number(process.env.BILLING_ALERT_THRESHOLD || '0') || undefined);

  const now = Date.now();
  const windowStart = new Date().setUTCHours(0, 0, 0, 0);
  let entry = store.get(key);

  if (!entry || entry.windowStart < windowStart) {
    entry = { spend: 0, windowStart };
    store.set(key, entry);
  }

  if (limit && entry.spend + args.cost > limit) {
    return { allowed: false, alert: true, currentSpend: entry.spend };
  }

  entry.spend += args.cost;
  const alert = !!alertThreshold && entry.spend >= alertThreshold;

  return { allowed: true, alert, currentSpend: entry.spend };
}
