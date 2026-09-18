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
  states: string[]
}[] = [
  {
    id: 'triage_started',
    label: 'Triage started',
    states: ['STARTED', 'TRIAGE_IN_PROGRESS'],
  },
  {
    id: 'triage_unpaid',
    label: 'Triage completed, not paid',
    states: ['TRIAGE_COMPLETED', 'PAYMENT_PENDING'],
  },
  {
    id: 'paid',
    label: 'Paid',
    states: ['PAID', 'BOOKING_PENDING', 'BOOKED', 'DOCTOR_NOTIFIED'],
  },
  {
    id: 'consultation_completed',
    label: 'Consultation completed',
    states: ['COMPLETED'],
  },
  {
    id: 'inactive',
    label: 'Inactive',
    states: ['EXPIRED'],
  },
]

const STATE_TO_SEGMENT = Object.fromEntries(
  LEAD_SEGMENTS.flatMap((segment) => segment.states.map((state) => [state, segment.id])),
) as Record<string, LeadSegmentId>

const LABEL_BY_ID = Object.fromEntries(LEAD_SEGMENTS.map((s) => [s.id, s.label])) as Record<
  LeadSegmentId,
  string
>

export function leadSegmentForState(state?: string): LeadSegmentId | '' {
  return STATE_TO_SEGMENT[String(state || '').trim()] || ''
}

export function leadSegmentLabel(segment?: string | null): string {
  if (!segment) return '—'
  return LABEL_BY_ID[segment as LeadSegmentId] || segment
}
