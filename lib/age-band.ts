export const AGE_BANDS = [
  { value: 'under_6', label: 'Under 6' },
  { value: 'age_6_8', label: '6–8' },
  { value: 'age_9_12', label: '9–12' },
  { value: 'age_13_15', label: '13–15' },
  { value: 'age_16_17', label: '16–17' },
] as const;

export type AgeBandValue = (typeof AGE_BANDS)[number]['value'];

export function getAgeBandLabel(value: string): string {
  return AGE_BANDS.find((band) => band.value === value)?.label ?? value;
}
