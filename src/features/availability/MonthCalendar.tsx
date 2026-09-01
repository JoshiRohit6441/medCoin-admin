import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import type {
  AvailabilityBooking,
  ConsultationDateOverride,
  ConsultationDayHours,
} from '../../types/admin'
import {
  TINT,
  WEEKDAYS,
  bookingsByDate,
  effectiveHoursForDate,
  freeSlotsByDate,
  monthGrid,
  monthLabel,
} from './availabilityModel'

type Props = {
  cursor: { year: number; month: number }
  timezone: string
  today: string
  selectedDate: string
  hours: ConsultationDayHours[]
  overrides: ConsultationDateOverride[]
  freeSlots: string[]
  bookings: AvailabilityBooking[]
  slotWindowEnd: string
  onSelect: (date: string) => void
  onCursorChange: (cursor: { year: number; month: number }) => void
  onToday: () => void
}

export default function MonthCalendar({
  cursor,
  timezone,
  today,
  selectedDate,
  hours,
  overrides,
  freeSlots,
  bookings,
  slotWindowEnd,
  onSelect,
  onCursorChange,
  onToday,
}: Props) {
  const cells = useMemo(() => monthGrid(cursor), [cursor])
  const freeMap = useMemo(() => freeSlotsByDate(freeSlots, timezone), [freeSlots, timezone])
  const bookingMap = useMemo(() => bookingsByDate(bookings, timezone), [bookings, timezone])

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            aria-label="Previous month"
            onClick={() =>
              onCursorChange({
                year: cursor.month === 0 ? cursor.year - 1 : cursor.year,
                month: cursor.month === 0 ? 11 : cursor.month - 1,
              })
            }
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
            {monthLabel(cursor)}
          </Typography>
          <IconButton
            size="small"
            aria-label="Next month"
            onClick={() =>
              onCursorChange({
                year: cursor.month === 11 ? cursor.year + 1 : cursor.year,
                month: cursor.month === 11 ? 0 : cursor.month + 1,
              })
            }
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Button size="small" onClick={onToday}>
          Today
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 0.5,
        }}
      >
        {WEEKDAYS.map((day) => (
          <Typography
            key={day.wday}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 600, pb: 0.5 }}
          >
            {day.short}
          </Typography>
        ))}

        {cells.map((cell) => {
          const effective = effectiveHoursForDate(cell.date, hours, overrides)
          const isToday = cell.date === today
          const isSelected = cell.date === selectedDate
          const hasOverride = effective.source === 'override'
          const free = cell.date >= today && cell.date <= slotWindowEnd
            ? (freeMap.get(cell.date)?.length ?? 0)
            : null
          const booked = bookingMap.get(cell.date)?.length ?? 0

          const bg = !effective.enabled
            ? TINT.closed
            : hasOverride
              ? TINT.exception
              : booked
                ? TINT.booked
                : TINT.open

          return (
            <Box
              key={cell.date}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(cell.date)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(cell.date)
              }}
              sx={{
                position: 'relative',
                minHeight: 88,
                p: 0.75,
                borderRadius: 1.5,
                cursor: 'pointer',
                border: isToday ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.dark' : isToday ? 'primary.main' : 'divider',
                boxShadow: isSelected ? '0 0 0 3px rgba(15,39,68,0.14)' : 'none',
                bgcolor: bg,
                opacity: cell.inMonth ? 1 : 0.6,
                transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
              }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                {isToday ? (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'common.white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {cell.dayNumber}
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {cell.dayNumber}
                  </Typography>
                )}
                {hasOverride ? (
                  <Box
                    aria-label="date exception"
                    sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main' }}
                  />
                ) : null}
              </Stack>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontSize: 10.5,
                  lineHeight: 1.35,
                  color: effective.enabled ? 'text.primary' : 'text.disabled',
                }}
              >
                {effective.enabled ? `${effective.from}–${effective.to}` : 'Closed'}
              </Typography>

              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.25 }}>
                {booked ? <Count color="primary.main" label={`${booked} booked`} /> : null}
                {free ? <Count color="success.main" label={`${free} free`} /> : null}
                {!booked && free === 0 && effective.enabled ? (
                  <Typography variant="caption" sx={{ fontSize: 9.5, color: 'text.disabled' }}>
                    no free slots
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          )
        })}
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Legend color={TINT.open} label="Open" />
        <Legend color={TINT.booked} label="Has bookings" />
        <Legend color={TINT.exception} label="Date exception" />
        <Legend color={TINT.closed} label="Closed" />
        <Typography variant="caption" color="text.secondary">
          Free counts come from Calendly up to {slotWindowEnd}; bookings for the whole month.
        </Typography>
      </Stack>
    </Box>
  )
}

function Count({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="caption" sx={{ fontSize: 9.5, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: 0.5,
          bgcolor: color,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}
