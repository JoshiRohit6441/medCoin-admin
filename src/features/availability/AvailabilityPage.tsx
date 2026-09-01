import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { SettingsFormSkeleton } from '../../components/layout/AppSkeletons'
import { useAppToast } from '../../hooks/useAppToast'
import {
  useGetAvailabilityQuery,
  useSyncAvailabilityToCalendlyMutation,
  useUpdateAvailabilityMutation,
} from '../../store/api/medcoinAdminApi'
import type {
  CalendlyWeekday,
  ConsultationDateOverride,
  ConsultationDayHours,
} from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
import DayEditor from './DayEditor'
import DaySchedule from './DaySchedule'
import MonthCalendar from './MonthCalendar'
import WeeklyHoursCard from './WeeklyHoursCard'
import {
  DAY_MS,
  DEFAULT_HOURS,
  bookingsByDate,
  freeSlotsByDate,
  monthRange,
  overrideIsRedundant,
  sortedHoursForApi,
  todayInTimezone,
  zonedParts,
} from './availabilityModel'

const FALLBACK_TZ = 'America/Sao_Paulo'

export default function AvailabilityPage() {
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const range = useMemo(() => monthRange(cursor), [cursor])
  const { data, isLoading, isFetching, refetch } = useGetAvailabilityQuery(range)
  const [updateAvailability, updateState] = useUpdateAvailabilityMutation()
  const [syncCalendly, syncState] = useSyncAvailabilityToCalendlyMutation()

  const timezone = data?.timezone || FALLBACK_TZ
  const today = todayInTimezone(timezone)

  const [hours, setHours] = useState<ConsultationDayHours[]>(DEFAULT_HOURS)
  const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => {
    if (!data?.hours?.length) return
    setHours(sortedHoursForApi(data.hours))
  }, [data?.hours])

  const overrides = useMemo(() => data?.dateOverrides ?? [], [data?.dateOverrides])
  const busy = updateState.isLoading || syncState.isLoading

  const hoursDirty = useMemo(() => {
    if (!data?.hours?.length) return false
    return (
      JSON.stringify(sortedHoursForApi(hours)) !== JSON.stringify(sortedHoursForApi(data.hours))
    )
  }, [hours, data?.hours])

  const windowDays = data?.windowDays ?? 7
  const slotWindowEnd = useMemo(
    () => zonedParts(new Date(Date.now() + (windowDays - 1) * DAY_MS), timezone).date,
    [windowDays, timezone],
  )

  const freeByDate = useMemo(
    () => freeSlotsByDate(data?.freeSlots ?? [], timezone),
    [data?.freeSlots, timezone],
  )
  const bookedByDate = useMemo(
    () => bookingsByDate(data?.bookings ?? [], timezone),
    [data?.bookings, timezone],
  )

  function patchDay(wday: CalendlyWeekday, patch: Partial<ConsultationDayHours>) {
    setHours((prev) => prev.map((day) => (day.wday === wday ? { ...day, ...patch } : day)))
  }

  async function saveWeeklyHours() {
    const invalid = hours.find((day) => day.enabled && day.from >= day.to)
    if (invalid) {
      showError(`${invalid.wday}: start time must be before end time.`)
      return
    }
    if (!hours.some((day) => day.enabled)) {
      showError('Enable at least one day.')
      return
    }

    try {
      const out = await updateAvailability({
        hours: sortedHoursForApi(hours),
        ...range,
      }).unwrap()
      if (out.sync && !out.sync.ok) {
        showError(`Saved, but Calendly sync failed: ${out.sync.error || 'unknown error'}`)
      } else {
        showSuccess('Weekly hours saved and synced to Calendly.')
      }
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function applyOverride(override: ConsultationDateOverride | null) {
    const next = overrides.filter((item) => item.date !== selectedDate)
    if (override && !overrideIsRedundant(override, hours)) {
      next.push(override)
    }

    try {
      const out = await updateAvailability({ dateOverrides: next, ...range }).unwrap()
      if (out.sync && !out.sync.ok) {
        showError(`Saved, but Calendly sync failed: ${out.sync.error || 'unknown error'}`)
        return
      }
      if (!override) {
        showSuccess('Date exception removed — the weekly hours apply again.')
      } else if (override.enabled) {
        showSuccess(`${selectedDate} open ${override.from}–${override.to}.`)
      } else {
        showSuccess(`${selectedDate} closed for bookings.`)
      }
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function handleResync() {
    try {
      const out = await syncCalendly(range).unwrap()
      if (out.sync && !out.sync.ok) {
        showError(`Calendly sync failed: ${out.sync.error || 'unknown error'}`)
      } else {
        showSuccess('Calendly schedule rebuilt from these settings.')
      }
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const upcomingExceptions = overrides.filter((item) => item.date >= today)

  const selectedOverride = overrides.find((item) => item.date === selectedDate)
  const dayEditorKey = selectedOverride
    ? `${selectedDate}|${selectedOverride.enabled}|${selectedOverride.from}|${selectedOverride.to}`
    : `${selectedDate}|weekly`

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <EventAvailableOutlinedIcon color="primary" />
            Consultation availability
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Sofia quotes these hours before payment, and every change is pushed to the Calendly
            schedule.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip size="small" variant="outlined" label={timezone} />
          <Button size="small" variant="outlined" onClick={() => void handleResync()} disabled={busy}>
            {syncState.isLoading ? 'Syncing…' : 'Re-sync Calendly'}
          </Button>
          <Button size="small" onClick={() => void refetch()} disabled={busy || isFetching}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Card variant="outlined">
          <CardContent>
            <SettingsFormSkeleton />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="outlined">
            <CardContent>
              <WeeklyHoursCard
                hours={hours}
                dirty={hoursDirty}
                busy={busy}
                saving={updateState.isLoading}
                onChange={patchDay}
                onSave={() => void saveWeeklyHours()}
                onReset={() => setHours(sortedHoursForApi(data?.hours ?? DEFAULT_HOURS))}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                {data?.hoursText || '—'}
                {typeof data?.slotsAvailable === 'number'
                  ? ` · ${data.slotsAvailable} free slots in the next ${windowDays} days`
                  : ''}
                {data?.bookings?.length ? ` · ${data.bookings.length} booked in view` : ''}
              </Typography>
              {data?.exceptionsText ? (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'warning.dark' }}>
                  Exceptions Sofia announces: {data.exceptionsText}
                </Typography>
              ) : null}

              {upcomingExceptions.length ? (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                    Upcoming date exceptions ({upcomingExceptions.length})
                  </Typography>
                  <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
                    {upcomingExceptions.map((item) => (
                      <Chip
                        key={item.date}
                        size="small"
                        color={item.enabled ? 'success' : 'default'}
                        variant={item.enabled ? 'outlined' : 'filled'}
                        label={`${item.date} · ${item.enabled ? `${item.from}–${item.to}` : 'closed'}`}
                        onClick={() => {
                          const [y, m] = item.date.split('-').map(Number)
                          setCursor({ year: y, month: m - 1 })
                          setSelectedDate(item.date)
                        }}
                      />
                    ))}
                  </Stack>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
              gap: 2.5,
              alignItems: 'start',
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <MonthCalendar
                  cursor={cursor}
                  timezone={timezone}
                  today={today}
                  selectedDate={selectedDate}
                  hours={hours}
                  overrides={overrides}
                  freeSlots={data?.freeSlots ?? []}
                  bookings={data?.bookings ?? []}
                  slotWindowEnd={slotWindowEnd}
                  onSelect={setSelectedDate}
                  onCursorChange={setCursor}
                  onToday={() => {
                    const nowDate = new Date()
                    setCursor({ year: nowDate.getFullYear(), month: nowDate.getMonth() })
                    setSelectedDate(today)
                  }}
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <DayEditor
                  key={dayEditorKey}
                  date={selectedDate}
                  today={today}
                  timezone={timezone}
                  hours={hours}
                  overrides={overrides}
                  freeSlots={freeByDate.get(selectedDate) ?? []}
                  bookings={bookedByDate.get(selectedDate) ?? []}
                  slotsKnown={selectedDate >= today && selectedDate <= slotWindowEnd}
                  saving={updateState.isLoading}
                  onApply={(override) => void applyOverride(override)}
                />
              </CardContent>
            </Card>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <DaySchedule
                key={`schedule-${selectedDate}`}
                date={selectedDate}
                today={today}
                timezone={timezone}
                hours={hours}
                overrides={overrides}
                freeSlots={freeByDate.get(selectedDate) ?? []}
                bookings={bookedByDate.get(selectedDate) ?? []}
                slotsKnown={selectedDate >= today && selectedDate <= slotWindowEnd}
              />
              {data?.syncedAt ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Last Calendly sync: {new Date(data.syncedAt).toLocaleString()}
                </Typography>
              ) : null}
            </CardContent>
          </Card>

          {data?.syncError ? (
            <Alert severity="warning">Last Calendly sync failed: {data.syncError}</Alert>
          ) : null}
          {data?.bookingsError ? (
            <Alert severity="warning">
              Booked meetings could not be read from Calendly: {data.bookingsError}
            </Alert>
          ) : null}
          {data?.liveLookupFailed ? (
            <Alert severity="info">
              Calendly live slot lookup is failing, so Sofia only quotes the configured hours. Check{' '}
              <code>CALENDLY_PERSONAL_ACCESS_TOKEN</code> on the server.
            </Alert>
          ) : null}
        </>
      )}
      <ToastHost />
    </Stack>
  )
}
