'use client';

import { useState } from 'react';
import BusinessPhase, { BUSINESS_CONFIGS, BusinessConfig, BusinessType } from './BusinessPhase';

export default function BusinessSimulator() {
  const [businessType, setBusinessType] = useState<BusinessType>('bakery');
  const [businessName, setBusinessName] = useState(BUSINESS_CONFIGS.bakery.label);

  const handleTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    setBusinessName(BUSINESS_CONFIGS[type].label);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Business Simulator</h1>
      <p className="text-mv-dark/70 mb-6">
        Grow any business you choose. Pick a type, set your costs, and run a day to see how profit works.
      </p>

      <div className="mb-6">
        <label htmlFor="businessType" className="block text-sm font-medium text-mv-dark mb-1">
          Business type
        </label>
        <select
          id="businessType"
          value={businessType}
          onChange={(e) => handleTypeChange(e.target.value as BusinessType)}
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mv-primary"
        >
          {(Object.entries(BUSINESS_CONFIGS) as [BusinessType, BusinessConfig][]).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-mv-dark/60 mt-1">Pick the kind of business you want to run today.</p>
      </div>

      <div className="mb-8">
        <label htmlFor="businessName" className="block text-sm font-medium text-mv-dark mb-1">
          Business name
        </label>
        <input
          id="businessName"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value || BUSINESS_CONFIGS[businessType].label)}
          placeholder="Give your business a name"
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mv-primary"
        />
        <p className="text-xs text-mv-dark/60 mt-1">Give your business a fun name that customers will remember.</p>
      </div>

      <BusinessPhase businessType={businessType} businessName={businessName} />
    </div>
  );
}
