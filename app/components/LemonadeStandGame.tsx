'use client';

import { useMemo, useState } from 'react';
import LemonadeStandResult from './LemonadeStandResult';

type Weather = 'Sunny' | 'Hot' | 'Cloudy' | 'Rainy';

const WEATHER_BOOST: Record<Weather, number> = {
  Sunny: 1.2,
  Hot: 1.5,
  Cloudy: 0.8,
  Rainy: 0.4,
};

const CUP_COST = 0.1;
const LEMON_COST = 0.25;
const SUGAR_COST = 0.5;
const SUGAR_PER_CUP = 0.1;
const CUPS_PER_LEMON = 3;
const STARTING_BUDGET = 20;

function getRandomWeather(): Weather {
  const weathers: Weather[] = ['Sunny', 'Hot', 'Cloudy', 'Rainy'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function LemonadeStandGame() {
  const [budget] = useState(STARTING_BUDGET);
  const [cups, setCups] = useState(0);
  const [lemons, setLemons] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [price, setPrice] = useState(1.5);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [result, setResult] = useState<{
    demand: number;
    cupsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    maxCups: number;
    limitingIngredient: string;
  } | null>(null);

  const cost = cups * CUP_COST + lemons * LEMON_COST + sugar * SUGAR_COST;
  const quantity = Math.min(cups, lemons * CUPS_PER_LEMON, Math.floor(sugar / SUGAR_PER_CUP));

  const canRun = quantity > 0 && price > 0 && cost <= budget;

  const handleRun = () => {
    const w = getRandomWeather();
    setWeather(w);
    const weatherFactor = WEATHER_BOOST[w];
    const demand = Math.max(0, Math.floor((100 * weatherFactor) / price));
    const maxCups = quantity;
    const cupsSold = Math.min(maxCups, demand);
    const revenue = cupsSold * price;
    const totalCost = cost;
    const profit = revenue - totalCost;

    let limitingIngredient: string;
    if (maxCups === cups) {
      limitingIngredient = 'cups';
    } else if (maxCups === lemons * CUPS_PER_LEMON) {
      limitingIngredient = 'lemons';
    } else {
      limitingIngredient = 'sugar';
    }

    setResult({ demand, cupsSold, revenue, cost: totalCost, profit, maxCups, limitingIngredient });
  };

  const handleReplay = () => {
    setCups(0);
    setLemons(0);
    setSugar(0);
    setPrice(1.5);
    setWeather(null);
    setResult(null);
  };

  const weatherClass = useMemo(() => {
    switch (weather) {
      case 'Hot':
        return 'text-red-500';
      case 'Sunny':
        return 'text-mv-yellow';
      case 'Cloudy':
        return 'text-gray-500';
      case 'Rainy':
        return 'text-blue-500';
      default:
        return 'text-mv-dark';
    }
  }, [weather]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Lemonade Stand Profit Game</h1>
      <p className="text-mv-dark/70 mb-8">
        Run your own lemonade stand. Buy ingredients, set a price, and see how the weather affects your profit.
      </p>

      <div className="mb-6 p-4 bg-mv-light rounded-xl flex justify-between items-center">
        <span className="text-mv-dark font-medium">Budget</span>
        <span className="text-xl font-bold text-mv-primary">{formatCurrency(budget)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="cups" className="block text-sm font-medium text-mv-dark mb-1">
            Cups ({formatCurrency(CUP_COST)} each)
          </label>
          <input
            id="cups"
            type="number"
            min={0}
            max={Math.floor(budget / CUP_COST)}
            value={cups}
            onChange={(e) => setCups(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How many cups you buy so you can serve lemonade.</p>
        </div>
        <div>
          <label htmlFor="lemons" className="block text-sm font-medium text-mv-dark mb-1">
            Lemons ({formatCurrency(LEMON_COST)} each, 1 lemon makes {CUPS_PER_LEMON} cups)
          </label>
          <input
            id="lemons"
            type="number"
            min={0}
            max={Math.floor(budget / LEMON_COST)}
            value={lemons}
            onChange={(e) => setLemons(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How many lemons you buy; each lemon makes 3 cups of lemonade.</p>
        </div>
        <div>
          <label htmlFor="sugar" className="block text-sm font-medium text-mv-dark mb-1">
            Sugar ({formatCurrency(SUGAR_COST)} each, makes 10 cups)
          </label>
          <input
            id="sugar"
            type="number"
            min={0}
            max={Math.floor(budget / SUGAR_COST)}
            value={sugar}
            onChange={(e) => setSugar(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How much sugar you buy; each batch makes 10 cups of lemonade.</p>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="price" className="block text-sm font-medium text-mv-dark mb-1">
          Price per cup
        </label>
        <input
          id="price"
          type="number"
          min={0.1}
          step={0.1}
          value={price}
          onChange={(e) => setPrice(Math.max(0.1, Number(e.target.value)))}
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
        />
        <p className="text-xs text-mv-dark/60 mt-1">How much you charge for one cup of lemonade.</p>
      </div>

      <div className="mb-6 p-4 bg-mv-light rounded-xl flex justify-between items-center">
        <span className="text-mv-dark font-medium">Total cost</span>
        <span className="text-lg font-bold text-mv-dark">{formatCurrency(cost)}</span>
      </div>

      {cost > budget && (
        <p className="text-red-500 text-sm mb-4">You spent more than your budget. Lower your ingredient amounts.</p>
      )}

      {quantity > 0 && cost <= budget && (
        <p className="text-mv-primary text-sm mb-4">
          You have enough ingredients to make up to <strong>{quantity} cups</strong>.
        </p>
      )}

      <button
        onClick={handleRun}
        disabled={!canRun}
        className="w-full md:w-auto px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Run the stand
      </button>

      {weather && result && (
        <div className="mt-8">
          <p className="text-xl font-semibold text-mv-dark mb-4">
            The weather is{' '}
            <span className={weatherClass} aria-label={weather}>
              {weather}
            </span>
          </p>
          <LemonadeStandResult
            weather={weather}
            weatherFactor={WEATHER_BOOST[weather]}
            demand={result.demand}
            cupsSold={result.cupsSold}
            maxCups={result.maxCups}
            limitingIngredient={result.limitingIngredient}
            price={price}
            revenue={result.revenue}
            cost={result.cost}
            profit={result.profit}
            onReplay={handleReplay}
          />
        </div>
      )}
    </div>
  );
}
