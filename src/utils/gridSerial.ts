import type { GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import { formatDateTime } from './dateFormat'

export { formatDateTime }

export const SERIAL_FIELD = '__serial'

export function dateTimeColumn<T extends GridValidRowModel = GridValidRowModel>(
  field: string,
  headerName: string,
  overrides: Partial<GridColDef<T>> = {}
): GridColDef<T> {
  return {
    field,
    headerName,
    type: 'string',
    minWidth: 180,
    flex: 0.5,
    sortable: true,
    renderCell: (params) => formatDateTime(params.value),
    ...overrides,
  }
}

export function serialColumn<T extends GridValidRowModel = GridValidRowModel>(): GridColDef<T> {
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
