/** Money Tree — small formatting helpers shared by the UI. */

/** Round to whole dollars with a leading $ and thousands separators. */
export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

/** Format a return fraction as a signed percentage, e.g. 0.073 → "+7%". */
export function percent(fraction: number): string {
  const pct = Math.round(fraction * 100);
  return (pct >= 0 ? '+' : '') + pct + '%';
}
