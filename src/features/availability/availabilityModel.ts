import type {
  AvailabilityBooking,
  CalendlyWeekday,
  ConsultationDateOverride,
  ConsultationDayHours,
} from '../../types/admin'

export const WEEKDAYS: { wday: CalendlyWeekday; label: string; short: string }[] = [
  { wday: 'sunday', label: 'Sunday', short: 'Sun' },
  { wday: 'monday', label: 'Monday', short: 'Mon' },
  { wday: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { wday: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { wday: 'thursday', label: 'Thursday', short: 'Thu' },
  { wday: 'friday', label: 'Friday', short: 'Fri' },
  { wday: 'saturday', label: 'Saturday', short: 'Sat' },
]

/** Editor order: week starts on Monday, matching the weekly hours list. */
export const EDITOR_WEEKDAYS: CalendlyWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const DEFAULT_HOURS: ConsultationDayHours[] = WEEKDAYS.map(({ wday }) => ({
  wday,
  enabled: wday !== 'saturday' && wday !== 'sunday',
  from: '16:00',
  to: '20:00',
}))

export const DAY_MS = 24 * 60 * 60 * 1000

/** MUI has no `x.50` shades, so availability tints are defined once here. */
export const TINT = {
  open: 'rgba(46, 125, 50, 0.10)',
  openStrong: 'rgba(46, 125, 50, 0.18)',
  booked: 'rgba(15, 39, 68, 0.10)',
  exception: 'rgba(237, 108, 2, 0.14)',
  closed: 'rgba(15, 39, 68, 0.045)',
  neutral: 'rgba(15, 39, 68, 0.08)',
} as const

export function zonedParts(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
  }
}

export function toMinutes(time: string) {
  const [h, m] = String(time || '0:0').split(':')
  return Number(h) * 60 + Number(m)
}

export function fromMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function floorToHalfHour(time: string) {
  const minutes = toMinutes(time)
  return fromMinutes(minutes - (minutes % 30))
}

export function todayInTimezone(timezone: string) {
  return zonedParts(new Date(), timezone).date
}

export function weekdayFromDateString(date: string): CalendlyWeekday | '' {
  const [y, m, d] = String(date || '')
    .split('-')
    .map(Number)
  if (!y || !m || !d) return ''
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]?.wday ?? ''
}

export type EffectiveDay = {
  date: string
  wday: CalendlyWeekday | ''
  enabled: boolean
  from: string
  to: string
  source: 'weekly' | 'override'
}

/** Mirrors the server rule: a date exception replaces the weekly rule for that date. */
export function effectiveHoursForDate(
  date: string,
  hours: ConsultationDayHours[],
  overrides: ConsultationDateOverride[],
): EffectiveDay {
  const wday = weekdayFromDateString(date)
  const override = overrides.find((item) => item.date === date)
  if (override) {
    return {
      date,
      wday,
      enabled: Boolean(override.enabled),
      from: override.from,
      to: override.to,
      source: 'override',
    }
  }
  const day = hours.find((h) => h.wday === wday)
  return {
    date,
    wday,
    enabled: Boolean(day?.enabled),
    from: day?.from || '16:00',
    to: day?.to || '20:00',
    source: 'weekly',
  }
}

/** True when the exception matches what the weekly rule already says. */
export function overrideIsRedundant(
  override: ConsultationDateOverride,
  hours: ConsultationDayHours[],
) {
  const weekly = hours.find((h) => h.wday === weekdayFromDateString(override.date))
  const weeklyEnabled = Boolean(weekly?.enabled)
  if (override.enabled !== weeklyEnabled) return false
  if (!override.enabled) return true
  return override.from === weekly?.from && override.to === weekly?.to
}

export function addMonths(cursor: { year: number; month: number }, delta: number) {
  const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
}

export function monthLabel({ year, month }: { year: number; month: number }) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)))
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** Six-week grid (Sunday first) covering the month, like Calendly's date picker. */
export function monthGrid({ year, month }: { year: number; month: number }) {
  const first = new Date(Date.UTC(year, month, 1))
  const start = new Date(first)
  start.setUTCDate(1 - first.getUTCDay())

  const cells: { date: string; inMonth: boolean; dayNumber: number }[] = []
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + i)
    cells.push({
      date: dateKey(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()),
      inMonth: day.getUTCMonth() === month,
      dayNumber: day.getUTCDate(),
    })
  }
  return cells
}

export function monthRange({ year, month }: { year: number; month: number }) {
  const cells = monthGrid({ year, month })
  return { from: cells[0].date, to: cells[cells.length - 1].date }
}

export function groupByDate<T>(items: T[], getIso: (item: T) => string, timezone: string) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const iso = getIso(item)
    if (!iso) continue
    const { date } = zonedParts(iso, timezone)
    const list = map.get(date)
    if (list) list.push(item)
    else map.set(date, [item])
  }
  return map
}

export function bookingsByDate(bookings: AvailabilityBooking[], timezone: string) {
  return groupByDate(bookings, (b) => b.start, timezone)
}

export function freeSlotsByDate(slots: string[], timezone: string) {
  return groupByDate(slots, (s) => s, timezone)
}

export function formatDateLong(date: string, timezone: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d, 12))) + ` · ${timezone}`
}

export function clockInZone(iso: string, timezone: string) {
  return zonedParts(iso, timezone).time
}

export function sortedHoursForApi(hours: ConsultationDayHours[]) {
  return WEEKDAYS.map(({ wday }) => hours.find((h) => h.wday === wday)).filter(
    (h): h is ConsultationDayHours => Boolean(h),
  )
}
