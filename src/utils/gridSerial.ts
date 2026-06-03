import type { GridColDef } from '@mui/x-data-grid'

export const SERIAL_FIELD = '__serial'

export function serialColumn<T>(): GridColDef<T> {
  return {
    field: SERIAL_FIELD,
    headerName: '#',
    width: 72,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center',
  }
}

export function withSerialNumbers<T extends object>(
  items: T[],
  pageIndex: number,
  pageSize: number
): (T & { __serial: number })[] {
  const base = pageIndex * pageSize
  return items.map((item, index) => ({
    ...item,
    [SERIAL_FIELD]: base + index + 1,
  }))
}

export function formatDateTime(value: unknown): string {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleString()
  } catch {
    return String(value)
  }
}
