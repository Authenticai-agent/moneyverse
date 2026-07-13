'use client';

import { useEffect, useState } from 'react';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

export type BusinessType = 'bakery' | 'amazon' | 'birdhouse' | 'mowing' | 'landscaping';

interface BusinessConfig {
  label: string;
  unit: string;
  staffLabel: string;
  rent: number;
  wageRate: number;
  costPerUnit: number;
  wasteCostPerUnit: number;
  advertisingLabel: string;
}

export const BUSINESS_CONFIGS: Record<BusinessType, BusinessConfig> = {
  bakery: {
    label: 'Bakery',
    unit: 'items',
    staffLabel: 'bakers',
    rent: 50,
    wageRate: 15,
    costPerUnit: 0.5,
    wasteCostPerUnit: 0.2,
    advertisingLabel: 'Advertising budget',
  },
  amazon: {
    label: 'Amazon (e-commerce)',
    unit: 'packages',
    staffLabel: 'warehouse workers',
    rent: 500,
    wageRate: 20,
    costPerUnit: 2,
    wasteCostPerUnit: 1,
    advertisingLabel: 'Ad spend / marketplace fees',
  },
  birdhouse: {
    label: 'Birdhouse Building',
    unit: 'birdhouses',
    staffLabel: 'builders',
    rent: 20,
    wageRate: 12,
    costPerUnit: 5,
    wasteCostPerUnit: 1,
    advertisingLabel: 'Advertising budget',
  },
  mowing: {
    label: 'Grass Mowing',
    unit: 'lawns',
    staffLabel: 'mowers',
    rent: 0,
    wageRate: 18,
    costPerUnit: 3,
    wasteCostPerUnit: 0.2,
    advertisingLabel: 'Advertising budget',
  },
  landscaping: {
    label: 'Landscaping',
    unit: 'jobs',
    staffLabel: 'crew members',
    rent: 30,
    wageRate: 22,
    costPerUnit: 15,
    wasteCostPerUnit: 2,
    advertisingLabel: 'Advertising budget',
  },
};

const MARKET_FACTORS = [
  { label: 'Recession', multiplier: 0.5 },
  { label: 'Rainy / Slow season', multiplier: 0.7 },
  { label: 'Normal day', multiplier: 0.85 },
  { label: 'Sunny / Holiday', multiplier: 1.0 },
  { label: 'Local festival', multiplier: 1.2 },
  { label: 'Economic boom', multiplier: 1.1 },
];

interface BusinessPhaseProps {
  businessType: BusinessType;
  businessName: string;
}

export default function BusinessPhase({ businessType, businessName }: BusinessPhaseProps) {
  const config = BUSINESS_CONFIGS[businessType];

  const [rent, setRent] = useState(config.rent);
  const [wageRate, setWageRate] = useState(config.wageRate);
  const [costPerUnit, setCostPerUnit] = useState(config.costPerUnit);
  const [wasteCostPerUnit, setWasteCostPerUnit] = useState(config.wasteCostPerUnit);
  const [price, setPrice] = useState(3);
  const [inventory, setInventory] = useState(30);
  const [staffHours, setStaffHours] = useState(2);
  const [advertising, setAdvertising] = useState(10);
  const [demand, setDemand] = useState(50);
  const [satisfaction, setSatisfaction] = useState(85);
  const [factor, setFactor] = useState(MARKET_FACTORS[2].label);
  const [result, setResult] = useState<{
    demand: number;
    sold: number;
    satisfaction: number;
    waste: number;
    revenue: number;
    cost: number;
    profit: number;
  } | null>(null);

  useEffect(() => {
    setRent(config.rent);
    setWageRate(config.wageRate);
    setCostPerUnit(config.costPerUnit);
    setWasteCostPerUnit(config.wasteCostPerUnit);
  }, [config]);

  const handleRun = () => {
    const marketMultiplier = MARKET_FACTORS.find((f) => f.label === factor)?.multiplier ?? 1;
    const sellThrough = Math.max(0, marketMultiplier * (satisfaction / 100));
    const sold = Math.min(inventory, Math.round(demand * sellThrough));
    const waste = inventory - sold;

    const revenue = sold * price;
    const cost = rent + staffHours * wageRate + advertising + inventory * costPerUnit + waste * wasteCostPerUnit;
    const profit = revenue - cost;

    setResult({ demand, sold, satisfaction, waste, revenue, cost, profit });
  };

  const unitTitle = config.unit.charAt(0).toUpperCase() + config.unit.slice(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Rent</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={rent}
              onChange={(e) => setRent(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Wage rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={wageRate}
              onChange={(e) => setWageRate(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
          <p className="text-xs text-mv-dark/60 mt-1">per {config.staffLabel} per hour</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Cost per {config.unit.slice(0, -1)}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Waste cost per unsold {config.unit.slice(0, -1)}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={wasteCostPerUnit}
              onChange={(e) => setWasteCostPerUnit(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Price per {config.unit.slice(0, -1)}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Inventory ({config.unit})</label>
          <input
            type="number"
            min={0}
            value={inventory}
            onChange={(e) => setInventory(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Staff hours</label>
          <input
            type="number"
            min={0}
            value={staffHours}
            onChange={(e) => setStaffHours(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">{config.advertisingLabel}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-dark/60">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={advertising}
              onChange={(e) => setAdvertising(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-mv-lavender pl-7 pr-4 py-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Market demand ({config.unit})</label>
          <input
            type="number"
            min={0}
            value={demand}
            onChange={(e) => setDemand(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Market factor</label>
          <select
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 bg-white"
          >
            {MARKET_FACTORS.map((f) => (
              <option key={f.label} value={f.label}>
                {f.label} ({Math.round(f.multiplier * 100)}%)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-mv-dark mb-1">Customer satisfaction</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={satisfaction}
              onChange={(e) => setSatisfaction(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">{satisfaction}%</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleRun}
        className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
      >
        Run {businessName} day
      </button>

      {result && (
        <div className="bg-mv-light rounded-2xl p-6 border border-mv-lavender">
          <h3 className="text-xl font-bold text-mv-primary mb-4">{businessName} Day Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-3 border border-mv-lavender">
              <p className="text-xs text-mv-dark/70">Demand</p>
              <p className="font-bold text-mv-dark">{formatNumber(result.demand)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender">
              <p className="text-xs text-mv-dark/70">Sold</p>
              <p className="font-bold text-mv-dark">{formatNumber(result.sold)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender">
              <p className="text-xs text-mv-dark/70">Satisfaction</p>
              <p className="font-bold text-mv-dark">{result.satisfaction}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-mv-lavender">
              <p className="text-xs text-mv-dark/70">Unsold / waste</p>
              <p className="font-bold text-mv-dark">{formatNumber(result.waste)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-mv-lavender">
              <p className="text-sm text-mv-dark/70">Revenue</p>
              <p className="text-2xl font-bold text-mv-green">{formatCurrency(result.revenue)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-mv-lavender">
              <p className="text-sm text-mv-dark/70">Costs</p>
              <p className="text-2xl font-bold text-mv-dark">{formatCurrency(result.cost)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-mv-lavender">
              <p className="text-sm text-mv-dark/70">Profit</p>
              <p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-mv-green' : 'text-red-500'}`}>
                {formatCurrency(result.profit)}
              </p>
            </div>
          </div>
          <p className="text-sm text-mv-dark/70 mt-4">
            {result.profit > 0
              ? `Your ${businessName} made a profit. Try raising advertising or inventory if demand is strong.`
              : result.profit === 0
              ? 'You broke even. Adjust price, waste, or advertising.'
              : `Your ${businessName} lost money. Try fewer staff, lower inventory, or a better price.`}
          </p>
        </div>
      )}
    </div>
  );
}
