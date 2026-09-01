import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type {
  AvailabilityBooking,
  ConsultationDateOverride,
  ConsultationDayHours,
} from '../../types/admin'
import {
  clockInZone,
  effectiveHoursForDate,
  formatDateLong,
  weekdayFromDateString,
  WEEKDAYS,
} from './availabilityModel'

type Mode = 'weekly' | 'custom' | 'closed'

type Props = {
  date: string
  today: string
  timezone: string
  hours: ConsultationDayHours[]
  overrides: ConsultationDateOverride[]
  freeSlots: string[]
  bookings: AvailabilityBooking[]
  slotsKnown: boolean
  saving: boolean
  onApply: (override: ConsultationDateOverride | null) => void
}

export default function DayEditor({
  date,
  today,
  timezone,
  hours,
  overrides,
  freeSlots,
  bookings,
  slotsKnown,
  saving,
  onApply,
}: Props) {
  const existing = overrides.find((item) => item.date === date)
  const weekly = hours.find((h) => h.wday === weekdayFromDateString(date))
  const effective = effectiveHoursForDate(date, hours, overrides)

  // The parent remounts this panel per date/exception, so props seed the form once.
  const [mode, setMode] = useState<Mode>(
    existing ? (existing.enabled ? 'custom' : 'closed') : 'weekly',
  )
  const [from, setFrom] = useState(existing?.from || weekly?.from || '16:00')
  const [to, setTo] = useState(existing?.to || weekly?.to || '20:00')
  const [error, setError] = useState('')

  const isPast = date < today
  const weeklyLabel = weekly?.enabled
    ? `${WEEKDAYS.find((w) => w.wday === weekly.wday)?.label} · ${weekly.from}–${weekly.to}`
    : `${WEEKDAYS.find((w) => w.wday === weekdayFromDateString(date))?.label} · closed`

  function handleApply() {
    if (mode === 'weekly') {
      onApply(null)
      return
    }
    if (mode === 'closed') {
      onApply({ date, enabled: false, from: from || '16:00', to: to || '20:00' })
      return
    }
    if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) {
      setError('Enter both times as HH:MM.')
      return
    }
    if (from >= to) {
      setError('Start time must be before end time.')
      return
    }
    setError('')
    onApply({ date, enabled: true, from, to })
  }

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {formatDateLong(date, timezone)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            size="small"
            color={effective.enabled ? 'success' : 'default'}
            variant={effective.enabled ? 'filled' : 'outlined'}
            label={effective.enabled ? `Open ${effective.from}–${effective.to}` : 'Closed'}
          />
          <Chip
            size="small"
            variant="outlined"
            color={effective.source === 'override' ? 'warning' : 'default'}
            label={effective.source === 'override' ? 'Date exception' : 'Weekly hours'}
          />
        </Stack>
      </Box>

      {isPast ? (
        <Alert severity="info">
          This date is in the past. Calendly only accepts exceptions for today onwards.
        </Alert>
      ) : null}

      <Divider />

      <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
        <FormControlLabel
          value="weekly"
          control={<Radio size="small" />}
          label={<Typography variant="body2">Use weekly hours ({weeklyLabel})</Typography>}
        />
        <FormControlLabel
          value="custom"
          control={<Radio size="small" />}
          label={<Typography variant="body2">Open this date with custom hours</Typography>}
        />
        <FormControlLabel
          value="closed"
          control={<Radio size="small" />}
          label={<Typography variant="body2">Close this date (no bookings)</Typography>}
        />
      </RadioGroup>

      <Stack direction="row" spacing={1.5}>
        <TextField
          label="From"
          type="time"
          size="small"
          value={from}
          disabled={mode !== 'custom'}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ htmlInput: { step: 900 }, inputLabel: { shrink: true } }}
          sx={{ width: 140 }}
        />
        <TextField
          label="To"
          type="time"
          size="small"
          value={to}
          disabled={mode !== 'custom'}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ htmlInput: { step: 900 }, inputLabel: { shrink: true } }}
          sx={{ width: 140 }}
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" size="small" onClick={handleApply} disabled={saving || isPast}>
          {saving ? 'Saving…' : 'Apply & sync'}
        </Button>
        {existing ? (
          <Button
            variant="text"
            size="small"
            color="warning"
            onClick={() => onApply(null)}
            disabled={saving}
          >
            Remove exception
          </Button>
        ) : null}
      </Stack>

      <Divider />

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Booked ({bookings.length})
        </Typography>
        {bookings.length ? (
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {bookings.map((booking) => (
              <Typography key={`${booking.start}-${booking.sessionId || booking.source}`} variant="caption" color="text.secondary">
                {clockInZone(booking.start, timezone)} ·{' '}
                {booking.patientName || 'Reserved in Calendly'}
                {booking.patientPhone ? ` · +${booking.patientPhone}` : ''}
                {booking.source === 'calendly' ? ' · Calendly' : ''}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            No meetings booked.
          </Typography>
        )}
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Free slots ({slotsKnown ? freeSlots.length : '—'})
        </Typography>
        {slotsKnown ? (
          freeSlots.length ? (
            <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {freeSlots.map((iso) => (
                <Chip key={iso} size="small" variant="outlined" label={clockInZone(iso, timezone)} />
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              No free slots on this date.
            </Typography>
          )
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Calendly publishes live slots only for the next few days.
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
