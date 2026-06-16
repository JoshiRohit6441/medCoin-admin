import type { ChipProps } from '@mui/material'

const STATE_LABELS: Record<string, string> = {
  STARTED: 'Started',
  TRIAGE_IN_PROGRESS: 'Triage in progress',
  TRIAGE_COMPLETED: 'Triage done',
  PAYMENT_PENDING: 'Awaiting payment',
  PAID: 'Paid',
  BOOKING_PENDING: 'Booking pending',
  BOOKED: 'Booked',
  DOCTOR_NOTIFIED: 'Doctor notified',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
}

const HIGHLIGHT_STATES = new Set(['PAYMENT_PENDING', 'TRIAGE_IN_PROGRESS', 'BOOKING_PENDING'])

export function consultationStateLabel(state?: string): string {
  const s = String(state || '').trim()
  return STATE_LABELS[s] || s || '—'
}

export function consultationStateChipColor(state?: string): ChipProps['color'] {
  const s = String(state || '')
  if (s === 'PAYMENT_PENDING') return 'warning'
  if (s === 'TRIAGE_IN_PROGRESS' || s === 'BOOKING_PENDING') return 'info'
  if (s === 'COMPLETED' || s === 'BOOKED' || s === 'DOCTOR_NOTIFIED') return 'success'
  if (s === 'EXPIRED') return 'error'
  if (s === 'PAID') return 'success'
  return 'default'
}

export function isHighlightedConsultationState(state?: string): boolean {
  return HIGHLIGHT_STATES.has(String(state || ''))
}

export const CONSULTATION_STATE_OPTIONS = Object.entries(STATE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Matches dashboard "Completed flow" card filter */
export const COMPLETED_FLOW_STATES = 'BOOKED,DOCTOR_NOTIFIED,COMPLETED'

/** In-progress sessions (everything except expired and completed). */
export const ACTIVE_SESSION_STATE_LIST = [
  'STARTED',
  'TRIAGE_IN_PROGRESS',
  'TRIAGE_COMPLETED',
  'PAYMENT_PENDING',
  'PAID',
  'BOOKING_PENDING',
  'BOOKED',
  'DOCTOR_NOTIFIED',
] as const

export const ACTIVE_SESSION_STATES = ACTIVE_SESSION_STATE_LIST.join(',')

export function isActiveSessionStateFilter(stateFilter?: string): boolean {
  if (!stateFilter) return false
  const parts = new Set(stateFilter.split(',').map((s) => s.trim()).filter(Boolean))
  if (parts.size !== ACTIVE_SESSION_STATE_LIST.length) return false
  return ACTIVE_SESSION_STATE_LIST.every((state) => parts.has(state))
}

export type ConsultationStatus = 'Active' | 'Completed' | 'Expired'

const COMPLETED_STATE_SET = new Set(['COMPLETED', 'BOOKED', 'DOCTOR_NOTIFIED'])

export function resolveConsultationStatus(state?: string): ConsultationStatus {
  const s = String(state || '').trim()
  if (s === 'EXPIRED') return 'Expired'
  if (COMPLETED_STATE_SET.has(s)) return 'Completed'
  return 'Active'
}

export function consultationStatusLabel(state?: string): string {
  return resolveConsultationStatus(state)
}

export function consultationStatusChipColor(state?: string): ChipProps['color'] {
  const status = resolveConsultationStatus(state)
  if (status === 'Expired') return 'error'
  if (status === 'Completed') return 'success'
  return 'primary'
}
