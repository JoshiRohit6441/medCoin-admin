export const LEAD_SEGMENT_IDS = [
  'triage_started',
  'triage_unpaid',
  'paid',
  'consultation_completed',
  'inactive',
] as const

export type LeadSegmentId = (typeof LEAD_SEGMENT_IDS)[number]

export const LEAD_SEGMENTS: {
  id: LeadSegmentId
  label: string
}[] = [
  { id: 'triage_started', label: 'Triage started' },
  { id: 'triage_unpaid', label: 'Triage completed, not paid' },
  { id: 'paid', label: 'Paid' },
  { id: 'consultation_completed', label: 'Consultation completed' },
  { id: 'inactive', label: 'Inactive' },
]

const BOOKED_STATES = new Set(['BOOKED', 'DOCTOR_NOTIFIED'])

function hasAppointment(session?: { appointmentStartAt?: string | null }): boolean {
  const at = session?.appointmentStartAt
  if (!at) return false
  const time = new Date(at).getTime()
  return Number.isFinite(time)
}

export function leadSegmentForSession(session?: {
  state?: string
  appointmentStartAt?: string | null
  leadSegment?: string
}): LeadSegmentId | '' {
  if (session?.leadSegment && LEAD_SEGMENT_IDS.includes(session.leadSegment as LeadSegmentId)) {
    return session.leadSegment as LeadSegmentId
  }
  const state = String(session?.state || '').trim()
  if (state === 'STARTED' || state === 'TRIAGE_IN_PROGRESS') return 'triage_started'
  if (state === 'TRIAGE_COMPLETED' || state === 'PAYMENT_PENDING') return 'triage_unpaid'
  if (state === 'PAID' || state === 'BOOKING_PENDING') return 'paid'
  if (BOOKED_STATES.has(state)) return 'consultation_completed'
  if (state === 'EXPIRED') return 'inactive'
  if (state === 'COMPLETED') {
    return hasAppointment(session) ? 'consultation_completed' : 'inactive'
  }
  return ''
}

export function leadSegmentForState(state?: string): LeadSegmentId | '' {
  return leadSegmentForSession({ state })
}

const LABEL_BY_ID = Object.fromEntries(LEAD_SEGMENTS.map((s) => [s.id, s.label])) as Record<
  LeadSegmentId,
  string
>

export function leadSegmentLabel(segment?: string | null): string {
  if (!segment) return '—'
  return LABEL_BY_ID[segment as LeadSegmentId] || segment
}
