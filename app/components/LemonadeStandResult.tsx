'use client';

interface LemonadeStandResultProps {
  weather: string;
  weatherFactor: number;
  demand: number;
  cupsSold: number;
  maxCups: number;
  limitingIngredient: string;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  onReplay: () => void;
}

export default function LemonadeStandResult({
  weather,
  weatherFactor,
  demand,
  cupsSold,
  maxCups,
  limitingIngredient,
  price,
  revenue,
  cost,
  profit,
  onReplay,
}: LemonadeStandResultProps) {
  const format = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="bg-mv-light rounded-2xl p-6 md:p-8 border border-mv-lavender">
      <h2 className="text-2xl font-bold text-mv-primary mb-4">Day Results</h2>
      <p className="text-mv-dark/70 mb-4">The weather was <strong className="text-mv-dark">{weather}</strong>.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-xs text-mv-dark/60">Demand</p>
          <p className="text-xl font-bold text-mv-dark">{demand} cups</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-xs text-mv-dark/60">Sold</p>
          <p className="text-xl font-bold text-mv-dark">{cupsSold} cups</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-xs text-mv-dark/60">Price</p>
          <p className="text-xl font-bold text-mv-dark">{format(price)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-xs text-mv-dark/60">Weather boost</p>
          <p className="text-xl font-bold text-mv-dark">×{weatherFactor.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-sm text-mv-dark/70">Revenue</p>
          <p className="text-2xl font-bold text-mv-green">{format(revenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-sm text-mv-dark/70">Cost</p>
          <p className="text-2xl font-bold text-mv-dark">{format(cost)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-mv-lavender">
          <p className="text-sm text-mv-dark/70">Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-mv-green' : 'text-red-500'}`}>{format(profit)}</p>
        </div>
      </div>

      <p className="text-sm text-mv-dark/70 mb-4">
        {demand > maxCups
          ? `Demand was ${demand} cups, but you could only make ${maxCups} cups because you ran out of ${limitingIngredient}. You sold every cup you made.`
          : `You had enough ingredients for ${maxCups} cups and sold ${cupsSold} of them.`}
      </p>

      <p className="text-sm text-mv-dark/70 mb-6">
        {profit > 0
          ? 'Nice work! You made a profit. Try changing the price or ingredients to see what happens.'
          : profit === 0
          ? 'You broke even. Think about how price and demand work together.'
          : 'You lost money this time. Try a lower price, fewer ingredients, or watch the weather.'}
      </p>

      <button
        onClick={onReplay}
        className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
      >
        Play again
      </button>
    </div>
  );
}
