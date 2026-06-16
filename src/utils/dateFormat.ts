/** Admin panel — dates/times shown in Brasília (America/Sao_Paulo). */
export const ADMIN_TIMEZONE = 'America/Sao_Paulo'

function parseAdminDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const brMatch = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,\s*(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (brMatch) {
    const [, dd, mm, yyyy, hh, min, sec] = brMatch
    const isoDay = `${yyyy}-${mm}-${dd}`
    if (!hh) {
      return new Date(`${isoDay}T12:00:00-03:00`)
    }
    return new Date(`${isoDay}T${hh}:${min}:${sec ?? '00'}-03:00`)
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ADMIN_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ADMIN_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatDateTime(value: unknown): string {
  const d = parseAdminDate(value)
  if (!d) return value != null && value !== '' ? String(value) : '—'
  return dateTimeFormatter.format(d)
}

export function formatDate(value: unknown): string {
  const d = parseAdminDate(value)
  if (!d) return value != null && value !== '' ? String(value) : '—'
  return dateFormatter.format(d)
}

/** HTML date input bounds (YYYY-MM-DD). */
export const DATE_INPUT_MIN = '2000-01-01'
export const DATE_INPUT_MAX = '2099-12-31'

const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** True for empty or a real calendar date within DATE_INPUT_MIN..DATE_INPUT_MAX. */
export function isValidDateInputValue(value: string): boolean {
  const raw = String(value || '').trim()
  if (!raw) return true

  const match = raw.match(DATE_INPUT_RE)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 2000 || year > 2099) return false

  const inst = new Date(
    `${match[1]}-${match[2]}-${match[3]}T12:00:00-03:00`
  )
  if (Number.isNaN(inst.getTime())) return false

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(inst)

  const got = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)])
  )
  return got.year === year && got.month === month && got.day === day
}

/** Drop invalid manual input; keep empty and in-range YYYY-MM-DD values. */
export function sanitizeDateInputValue(value: string): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return isValidDateInputValue(raw) ? raw : ''
}

export function buildDateRangeParams(
  from: string,
  to: string,
  field: 'created' | 'appointment' = 'created'
) {
  const validFrom = isValidDateInputValue(from) && from ? from : undefined
  const validTo = isValidDateInputValue(to) && to ? to : undefined
  if (field === 'appointment') {
    return { appointmentFrom: validFrom, appointmentTo: validTo }
  }
  return { createdFrom: validFrom, createdTo: validTo }
}
