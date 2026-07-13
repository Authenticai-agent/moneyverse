'use client';

import { BUILDINGS } from './buildings';

interface AccessibleControlsProps {
  onFocus?: (label: string, description: string) => void;
}

export default function AccessibleControls({ onFocus }: AccessibleControlsProps) {
  return (
    <div className="sr-only">
      <p>Interactive 3D MoneyVerse island. Use the buttons below to focus on each building.</p>
      <ul>
        {BUILDINGS.map((building) => (
          <li key={building.label}>
            <button type="button" onClick={() => onFocus?.(building.label, building.description)}>
              {building.label}: {building.description}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
