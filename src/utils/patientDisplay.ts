/** Valid patient age for display (1–130). Zero/null/invalid → unknown. */
export function formatPatientAge(age: unknown): string {
  const n = Number(age)
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n)
  if (rounded < 1 || rounded > 130) return '—'
  return String(rounded)
}

export function formatPatientAgeWithUnit(age: unknown): string {
  const label = formatPatientAge(age)
  return label === '—' ? label : `${label} years`
}
