'use client';

interface SavingsGoalPlanProps {
  goalName: string;
  target: number;
  current: number;
  weekly: number;
  weeksToGoal: number;
  requiredWeekly: number;
  email: string;
  /**
   * One-off money counted at the start of the plan - sold toys, birthday money,
   * minus anything the player chose to spend. Optional so existing callers are
   * unaffected.
   *
   * Without it the printed card does not add up: target $200, current $0,
   * $34 a week and 5 weeks reads as $170, because the $35 of one-off money that
   * closed the gap was nowhere on the page.
   */
  oneTime?: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SavingsGoalPlan({
  goalName,
  target,
  current,
  weekly,
  weeksToGoal,
  requiredWeekly,
  email,
  oneTime = 0,
}: SavingsGoalPlanProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender print:shadow-none print:border-0">
      <div className="print:block">
        <h2 className="text-2xl font-bold text-mv-primary mb-2">{goalName || 'My Savings Goal'}</h2>
        <p className="text-mv-dark/70 mb-6">A printable savings plan from MoneyVerse.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-mv-light rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Target amount</p>
            <p className="text-xl font-bold text-mv-dark">{formatCurrency(target)}</p>
          </div>
          <div className="bg-mv-light rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Current savings</p>
            <p className="text-xl font-bold text-mv-dark">{formatCurrency(current)}</p>
          </div>
          <div className="bg-mv-light rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Weekly contribution</p>
            <p className="text-xl font-bold text-mv-dark">{formatCurrency(weekly)}</p>
          </div>
          <div className="bg-mv-light rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Weeks to goal</p>
            <p className="text-xl font-bold text-mv-dark">{weeksToGoal}</p>
          </div>
          {oneTime !== 0 && (
            <div className="bg-mv-light rounded-xl p-4">
              <p className="text-sm text-mv-dark/70">
                {oneTime > 0 ? 'One-time money' : 'One-time spending'}
              </p>
              <p className="text-xl font-bold text-mv-dark">{formatCurrency(Math.abs(oneTime))}</p>
            </div>
          )}
        </div>

        {requiredWeekly !== weekly && requiredWeekly > 0 && (
          <p className="text-sm text-mv-dark/80 mb-4">
            To reach your goal in your timeline, you would need to save{' '}
            <strong>{formatCurrency(requiredWeekly)}</strong> per week.
          </p>
        )}

        {email && (
          <p className="text-sm text-mv-dark/60 mb-4">
            A copy can be emailed to: {email} (not sent in this preview)
          </p>
        )}

        <p className="text-sm text-mv-dark/70">
          Saving a little each week can add up. Stay consistent, watch for tradeoffs, and adjust as needed.
        </p>
      </div>

      <button
        onClick={handlePrint}
        className="mt-6 px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 print:hidden"
      >
        Print plan
      </button>
    </div>
  );
}
