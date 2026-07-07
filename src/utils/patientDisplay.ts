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

export function normalizePhoneDigits(phone: unknown): string {
  return String(phone ?? '').replace(/\D/g, '')
}

/** Opens WhatsApp chat with the patient (wa.me). Returns null if phone is too short. */
export function buildWhatsAppChatUrl(phone: unknown): string | null {
  const digits = normalizePhoneDigits(phone)
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}
