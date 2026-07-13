'use client';

import { useState } from 'react';

const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const RENT = 50;
const WAGE = 15;

export default function BakeryPhase() {
  const [price, setPrice] = useState(3);
  const [inventory, setInventory] = useState(30);
  const [wages, setWages] = useState(2);
  const [advertising, setAdvertising] = useState(10);
  const [result, setResult] = useState<{
    demand: number;
    sold: number;
    satisfaction: number;
    waste: number;
    revenue: number;
    cost: number;
    profit: number;
  } | null>(null);

  const handleRun = () => {
    const satisfaction = Math.floor(Math.random() * 40) + 60;
    const baseDemand = 50;
    const priceFactor = Math.max(0.2, 1 - (price - 3) * 0.2);
    const adFactor = 1 + advertising / 100;
    const demand = Math.floor(baseDemand * priceFactor * adFactor * (satisfaction / 100));
    const sold = Math.min(inventory, demand);
    const waste = inventory - sold;
    const ingredientCost = inventory * 0.5;
    const wasteCost = waste * 0.2;
    const revenue = sold * price;
    const cost = RENT + wages * WAGE + advertising + ingredientCost + wasteCost;
    const profit = revenue - cost;
    setResult({ demand, sold, satisfaction, waste, revenue, cost, profit });
  };

  return (
    <div className="space-y-6">
      <p className="text-mv-dark/70">
        Run a bakery. Set your price, inventory, staff, and advertising. Watch customer satisfaction, waste, and profit margin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Price per item</label>
          <input type="number" min={0.5} step={0.5} value={price} onChange={(e) => setPrice(Math.max(0.5, Number(e.target.value)))} className="w-full rounded-lg border border-mv-lavender px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Inventory (items)</label>
          <input type="number" min={0} value={inventory} onChange={(e) => setInventory(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-mv-lavender px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Staff hours</label>
          <input type="number" min={0} value={wages} onChange={(e) => setWages(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-mv-lavender px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Advertising budget</label>
          <input type="number" min={0} value={advertising} onChange={(e) => setAdvertising(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-mv-lavender px-4 py-2" />
        </div>
      </div>

      <button onClick={handleRun} className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90">
        Run bakery day
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-mv-light rounded-xl p-4">
        <p>Rent: <strong>{formatCurrency(RENT)}</strong></p>
        <p>Wage rate: <strong>{formatCurrency(WAGE)}</strong>/hour</p>
        <p>Ingredient cost: <strong>$0.50</strong>/item</p>
        <p>Waste cost: <strong>$0.20</strong>/unsold item</p>
      </div>

      {result && (
        <div className="bg-mv-light rounded-2xl p-6 border border-mv-lavender">
          <h3 className="text-xl font-bold text-mv-primary mb-4">Bakery Day Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-3 border border-mv-lavender"><p className="text-xs text-mv-dark/70">Demand</p><p className="font-bold text-mv-dark">{result.demand}</p></div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender"><p className="text-xs text-mv-dark/70">Sold</p><p className="font-bold text-mv-dark">{result.sold}</p></div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender"><p className="text-xs text-mv-dark/70">Satisfaction</p><p className="font-bold text-mv-dark">{result.satisfaction}%</p></div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender"><p className="text-xs text-mv-dark/70">Waste</p><p className="font-bold text-mv-dark">{result.waste}</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-mv-lavender"><p className="text-sm text-mv-dark/70">Revenue</p><p className="text-2xl font-bold text-mv-green">{formatCurrency(result.revenue)}</p></div>
            <div className="bg-white rounded-xl p-4 border border-mv-lavender"><p className="text-sm text-mv-dark/70">Costs</p><p className="text-2xl font-bold text-mv-dark">{formatCurrency(result.cost)}</p></div>
            <div className="bg-white rounded-xl p-4 border border-mv-lavender"><p className="text-sm text-mv-dark/70">Profit</p><p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-mv-green' : 'text-red-500'}`}>{formatCurrency(result.profit)}</p></div>
          </div>
          <p className="text-sm text-mv-dark/70 mt-4">
            {result.profit > 0
              ? 'Your bakery made a profit. Try raising advertising or inventory if demand is strong.'
              : result.profit === 0
              ? 'You broke even. Adjust price, waste, or advertising.'
              : 'Your bakery lost money. Try fewer staff, lower inventory, or a better price.'}
          </p>
        </div>
      )}
    </div>
  );
}
