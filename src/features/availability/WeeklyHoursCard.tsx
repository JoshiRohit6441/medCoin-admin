import { Box, Button, Stack, Switch, TextField, Typography } from '@mui/material'
import type { CalendlyWeekday, ConsultationDayHours } from '../../types/admin'
import { EDITOR_WEEKDAYS, WEEKDAYS } from './availabilityModel'

type Props = {
  hours: ConsultationDayHours[]
  dirty: boolean
  busy: boolean
  saving: boolean
  onChange: (wday: CalendlyWeekday, patch: Partial<ConsultationDayHours>) => void
  onSave: () => void
  onReset: () => void
}

export default function WeeklyHoursCard({
  hours,
  dirty,
  busy,
  saving,
  onChange,
  onSave,
  onReset,
}: Props) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Weekly hours
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        The default rule for every week. Single dates can be opened or closed in the calendar.
      </Typography>

      <Stack spacing={1.25} sx={{ mt: 1.5 }}>
        {EDITOR_WEEKDAYS.map((wday) => {
          const day = hours.find((h) => h.wday === wday)
          if (!day) return null
          const label = WEEKDAYS.find((w) => w.wday === wday)?.label || wday
          return (
            <Stack key={wday} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Switch
                checked={day.enabled}
                onChange={(e) => onChange(wday, { enabled: e.target.checked })}
                slotProps={{ input: { 'aria-label': `${label} enabled` } }}
              />
              <Typography variant="body2" sx={{ width: 84, fontWeight: 500 }}>
                {label}
              </Typography>
              <TextField
                label="From"
                type="time"
                size="small"
                value={day.from}
                disabled={!day.enabled}
                onChange={(e) => onChange(wday, { from: e.target.value })}
                slotProps={{ htmlInput: { step: 900 }, inputLabel: { shrink: true } }}
                sx={{ width: 128 }}
              />
              <TextField
                label="To"
                type="time"
                size="small"
                value={day.to}
                disabled={!day.enabled}
                onChange={(e) => onChange(wday, { to: e.target.value })}
                slotProps={{ htmlInput: { step: 900 }, inputLabel: { shrink: true } }}
                sx={{ width: 128 }}
              />
            </Stack>
          )
        })}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" size="small" onClick={onSave} disabled={busy || !dirty}>
          {saving ? 'Saving…' : 'Save & sync to Calendly'}
        </Button>
        <Button variant="text" size="small" onClick={onReset} disabled={busy || !dirty}>
          Discard changes
        </Button>
      </Stack>
    </Box>
  )
}
