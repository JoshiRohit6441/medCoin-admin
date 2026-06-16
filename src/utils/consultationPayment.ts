import type { ChipProps } from '@mui/material'
import type { Consultation } from '../types/admin'

export type ConsultationPaymentStatus = 'paid' | 'unpaid'

export function isConsultationPaid(row: Consultation): boolean {
  const pid = String(row.mercadoPagoPaymentId || '').trim()
  const state = String(row.state || '')
  const mpStatus = String(row.mercadoPagoStatus || '').toLowerCase()

  if (pid === 'mock') return true
  if (!pid) return false
  if (['rejected', 'cancelled', 'refunded'].includes(mpStatus)) return false
  if (
    ['PAID', 'BOOKING_PENDING', 'BOOKED', 'DOCTOR_NOTIFIED', 'COMPLETED'].includes(state)
  ) {
    return true
  }
  if (mpStatus === 'approved') return true
  return false
}

export function consultationPaymentStatusLabel(row: Consultation): 'Paid' | 'Unpaid' {
  return isConsultationPaid(row) ? 'Paid' : 'Unpaid'
}

export function consultationPaymentChipColor(row: Consultation): ChipProps['color'] {
  return isConsultationPaid(row) ? 'success' : 'warning'
}
