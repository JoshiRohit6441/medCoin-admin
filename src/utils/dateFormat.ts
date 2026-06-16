/** Admin panel — DD/MM/YYYY using UTC (matches API ISO timestamps in devtools). */
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
    if (!hh) {
      return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0))
    }
    return new Date(
      Date.UTC(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(sec ?? '0')
      )
    )
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatUtcDateTime(d: Date): string {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

function formatUtcDate(d: Date): string {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

export function formatDateTime(value: unknown): string {
  const d = parseAdminDate(value)
  if (!d) return value != null && value !== '' ? String(value) : '—'
  return formatUtcDateTime(d)
}

export function formatDate(value: unknown): string {
  const d = parseAdminDate(value)
  if (!d) return value != null && value !== '' ? String(value) : '—'
  return formatUtcDate(d)
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

  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

/** Drop invalid manual input; keep empty and in-range YYYY-MM-DD values. */
export function sanitizeDateInputValue(value: string): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return isValidDateInputValue(raw) ? raw : ''
}
