import CloseIcon from '@mui/icons-material/Close'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type {
  AvailabilityBooking,
  ConsultationDateOverride,
  ConsultationDayHours,
} from '../../types/admin'
import {
  TINT,
  clockInZone,
  effectiveHoursForDate,
  formatDateLong,
  fromMinutes,
  toMinutes,
} from './availabilityModel'

type Props = {
  date: string
  today: string
  timezone: string
  hours: ConsultationDayHours[]
  overrides: ConsultationDateOverride[]
  freeSlots: string[]
  bookings: AvailabilityBooking[]
  slotsKnown: boolean
}

type Slot =
  | { time: string; kind: 'booked'; booking: AvailabilityBooking }
  | { time: string; kind: 'free'; iso: string }
  | { time: string; kind: 'unpublished' }

export default function DaySchedule({
  date,
  today,
  timezone,
  hours,
  overrides,
  freeSlots,
  bookings,
  slotsKnown,
}: Props) {
  const [openTime, setOpenTime] = useState('')
  const effective = effectiveHoursForDate(date, hours, overrides)

  const slots = useMemo<Slot[]>(() => {
    const byTime = new Map<string, Slot>()

    if (effective.enabled) {
      for (let m = toMinutes(effective.from); m < toMinutes(effective.to); m += 30) {
        byTime.set(fromMinutes(m), { time: fromMinutes(m), kind: 'unpublished' })
      }
    }
    for (const iso of freeSlots) {
      const time = clockInZone(iso, timezone)
      byTime.set(time, { time, kind: 'free', iso })
    }
    for (const booking of bookings) {
      const time = clockInZone(booking.start, timezone)
      byTime.set(time, { time, kind: 'booked', booking })
    }

    return Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time))
  }, [effective.enabled, effective.from, effective.to, freeSlots, bookings, timezone])

  const selected = slots.find((slot) => slot.time === openTime)
  const bookedCount = slots.filter((s) => s.kind === 'booked').length
  const freeCount = slots.filter((s) => s.kind === 'free').length

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Day schedule — {formatDateLong(date, timezone).split(' · ')[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {effective.enabled ? `Open ${effective.from}–${effective.to}` : 'Closed for bookings'}
            {effective.source === 'override' ? ' · date exception' : ''}
            {` · ${bookedCount} booked · ${freeCount} open`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          <Chip size="small" label="Booked" color="primary" />
          <Chip
            size="small"
            label="Booked · Calendly only"
            color="primary"
            variant="outlined"
            sx={{ borderStyle: 'dashed' }}
          />
          <Chip size="small" label="Open" sx={{ bgcolor: TINT.openStrong, color: 'success.dark' }} />
          <Chip size="small" variant="outlined" label="Not published" />
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {slots.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
            gap: 1,
          }}
        >
          {slots.map((slot) => {
            const isSelected = slot.time === openTime
            const isBooked = slot.kind === 'booked'
            const isFree = slot.kind === 'free'
            const isCalendlyOnly = slot.kind === 'booked' && slot.booking.source === 'calendly'
            return (
              <Box
                key={slot.time}
                role="button"
                tabIndex={0}
                onClick={() => setOpenTime(isSelected ? '' : slot.time)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setOpenTime(isSelected ? '' : slot.time)
                }}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  border: isCalendlyOnly ? '1px dashed' : '1px solid',
                  borderColor: isSelected
                    ? 'primary.dark'
                    : isCalendlyOnly
                      ? 'rgba(255,255,255,0.65)'
                      : isBooked
                        ? 'primary.main'
                        : isFree
                          ? 'success.light'
                          : 'divider',
                  bgcolor: isBooked ? 'primary.main' : isFree ? TINT.open : 'transparent',
                  color: isBooked ? 'common.white' : isFree ? 'success.dark' : 'text.disabled',
                  boxShadow: isSelected ? '0 0 0 2px rgba(15,39,68,0.2)' : 'none',
                  transition: 'transform 120ms',
                  '&:hover': { transform: 'translateY(-1px)' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                  {slot.time}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 10.5 }}>
                  {isBooked
                    ? isCalendlyOnly
                      ? 'Calendly'
                      : (slot.booking.patientName || 'Booked').split(' ')[0]
                    : isFree
                      ? 'Open'
                      : 'Not published'}
                </Typography>
              </Box>
            )
          })}
        </Box>
      ) : (
        <Stack spacing={1} sx={{ alignItems: 'center', py: 3, color: 'text.secondary' }}>
          <EventBusyOutlinedIcon />
          <Typography variant="body2">
            {effective.enabled
              ? 'No slots published for this date yet.'
              : 'This date is closed, so there are no slots.'}
          </Typography>
        </Stack>
      )}

      {!slotsKnown && date >= today ? (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Calendly only publishes live slots for the next few days, so open times for this date are
          not listed yet. Booked meetings are still shown.
        </Alert>
      ) : null}

      {selected ? (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selected.time}
                {selected.kind === 'booked' && selected.booking.end
                  ? `–${clockInZone(selected.booking.end, timezone)}`
                  : ''}{' '}
                ·{' '}
                {selected.kind === 'booked'
                  ? selected.booking.source === 'calendly'
                    ? 'Booked consultation (Calendly only)'
                    : 'Booked consultation'
                  : selected.kind === 'free'
                    ? 'Open slot'
                    : 'Not published in Calendly'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateLong(date, timezone)}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Close details" onClick={() => setOpenTime('')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {selected.kind === 'booked' ? (
            <BookingDetails booking={selected.booking} timezone={timezone} />
          ) : selected.kind === 'free' ? (
            <Typography variant="body2" color="text.secondary">
              This time is available in Calendly and Sofia can offer it to patients right now.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Inside your hours but not offered by Calendly — usually because it is too close to
              now, blocked by the event buffer, or taken by another event on the connected calendar.
            </Typography>
          )}
        </Box>
      ) : null}
    </Box>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  )
}

function BookingDetails({
  booking,
  timezone,
}: {
  booking: AvailabilityBooking
  timezone: string
}) {
  const invitees =
    booking.inviteesActive != null
      ? `${booking.inviteesActive}${booking.inviteesLimit ? ` / ${booking.inviteesLimit}` : ''}`
      : null

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        <Field label="Patient" value={booking.patientName || '—'} />
        <Field label="WhatsApp" value={booking.patientPhone ? `+${booking.patientPhone}` : null} />
        <Field label="Age" value={booking.patientAge ?? null} />
        <Field label="Consultation state" value={booking.state || null} />
        <Field label="Severity" value={booking.severity || null} />
        <Field label="Payment" value={
          booking.paymentStatus
            ? `${booking.paymentStatus}${booking.paymentMethod ? ` · ${booking.paymentMethod}` : ''}`
            : null
        } />
        <Field label="Booking code" value={booking.bookingCode || null} />
        <Field
          label="Booked at"
          value={booking.bookedAt ? new Date(booking.bookedAt).toLocaleString() : null}
        />
        <Field label="Invitee" value={booking.inviteeName || null} />
        <Field label="Invitee email" value={booking.inviteeEmail || null} />
        <Field label="Calendly event" value={booking.eventName || null} />
        <Field label="Host" value={booking.hosts?.length ? booking.hosts.join(', ') : null} />
        <Field label="Invitees" value={invitees} />
        <Field
          label="Source"
          value={booking.source === 'calendly' ? 'Calendly only (no MedCoin session)' : 'MedCoin session'}
        />
        <Field
          label="Window"
          value={`${clockInZone(booking.start, timezone)}${
            booking.end ? `–${clockInZone(booking.end, timezone)}` : ''
          }`}
        />
      </Box>

      {booking.summary ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Triage summary
          </Typography>
          <Typography variant="body2">{booking.summary}</Typography>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {booking.meetingUrl ? (
          <Button
            size="small"
            variant="contained"
            endIcon={<OpenInNewIcon fontSize="small" />}
            href={booking.meetingUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open meeting link
          </Button>
        ) : (
          <Chip size="small" variant="outlined" label="No meeting link stored" />
        )}
        {booking.patientPhone ? (
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon fontSize="small" />}
            href={`https://wa.me/${booking.patientPhone}`}
            target="_blank"
            rel="noreferrer"
          >
            Message on WhatsApp
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
