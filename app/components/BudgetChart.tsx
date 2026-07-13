'use client';

interface BudgetChartProps {
  data: { label: string; amount: number; color: string }[];
  total: number;
}

export default function BudgetChart({ data, total }: BudgetChartProps) {
  const filtered = data.filter((d) => d.amount > 0);
  const max = total || 1;

  return (
    <div className="space-y-3" aria-label="Budget breakdown">
      {filtered.map((item) => {
        const percent = (item.amount / max) * 100;
        return (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-mv-dark">{item.label}</span>
              <span className="text-mv-dark/70">${item.amount.toFixed(2)}</span>
            </div>
            <div className="h-4 w-full bg-mv-lavender/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <p className="text-sm text-mv-dark/60">Add amounts to see your budget breakdown.</p>
      )}
    </div>
  );
}
