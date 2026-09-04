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

export function formatCpfDisplay(value?: string | null): string {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 11) return value ? String(value) : '—'
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function consultationInviteeEmail(row?: { calendlyInviteeEmail?: string } | null): string {
  return String(row?.calendlyInviteeEmail || '').trim()
}

export function consultationCpf(row?: {
  calendlyInviteeCpf?: string
  patient?: string | { cpf?: string } | null
} | null): string {
  const fromSession = String(row?.calendlyInviteeCpf || '').trim()
  if (fromSession) return fromSession
  const patient = row?.patient
  if (patient && typeof patient === 'object') return String(patient.cpf || '').trim()
  return ''
}

/** Opens WhatsApp chat with the patient (wa.me). Returns null if phone is too short. */
  const digits = normalizePhoneDigits(phone)
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}
