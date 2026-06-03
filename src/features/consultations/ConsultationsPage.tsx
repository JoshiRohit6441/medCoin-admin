import {
  Alert,
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import {
  useGetConsultationQuery,
  useListConsultationsQuery,
} from '../../store/api/medcoinAdminApi'
import type { Consultation } from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ gap: 1, px: 1, py: 1 }}>
      <GridToolbarQuickFilter debounceMs={400} />
    </GridToolbarContainer>
  )
}

function patientField(row: Consultation, key: 'phone' | 'name'): string {
  const p = row.patient
  if (p && typeof p === 'object' && key in p) return String((p as Record<string, string>)[key] ?? '')
  return ''
}

function patientAgeLabel(row: Consultation): string {
  const p = row.patient
  if (p && typeof p === 'object' && 'age' in p && (p as { age?: number }).age != null) {
    return String((p as { age: number }).age)
  }
  return '—'
}

const columns: GridColDef<Consultation>[] = [
  serialColumn(),
  {
    field: 'state',
    headerName: 'State',
    minWidth: 160,
    flex: 0.5,
  },
  {
    field: 'severity',
    headerName: 'Severity',
    width: 110,
  },
  {
    field: 'patientName',
    headerName: 'Patient',
    minWidth: 120,
    sortable: false,
    valueGetter: (_v, row) => patientField(row, 'name') || '—',
  },
  {
    field: 'patientAge',
    headerName: 'Age',
    width: 64,
    sortable: false,
    align: 'center',
    headerAlign: 'center',
    valueGetter: (_v, row) => patientAgeLabel(row),
  },
  {
    field: 'patientPhone',
    headerName: 'Phone',
    minWidth: 130,
    sortable: false,
    valueGetter: (_v, row) => patientField(row, 'phone'),
  },
  {
    field: 'bookingCode',
    headerName: 'Booking',
    minWidth: 120,
    flex: 0.3,
  },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    minWidth: 180,
    flex: 0.4,
    valueFormatter: (v) => formatDateTime(v),
  },
]

export default function ConsultationsPage() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ])
  const [quickFilter, setQuickFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListConsultationsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'updatedAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    bookingCode: quickFilter || undefined,
  })

  const detailQuery = useGetConsultationQuery(selectedId ?? '', { skip: !selectedId })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Consultations
        </Typography>
        <Button size="small" variant="outlined" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Quick filter searches booking code (backend <code>bookingCode</code> query).
      </Typography>
      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <Box sx={{ width: '100%', height: 560 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r._id}
          loading={isLoading}
          rowCount={data?.pagination.total ?? 0}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterMode="server"
          onFilterModelChange={(m) => {
            const q = m.quickFilterValues?.join(' ') ?? ''
            setQuickFilter(q)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          onRowClick={(params) => {
            setSelectedId(String(params.id))
            setSelectedSerial(Number(params.row.__serial) || null)
          }}
          pageSizeOptions={[10, 25, 50]}
          density="compact"
          disableRowSelectionOnClick
          slots={{ toolbar: Toolbar }}
          showToolbar
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiDataGrid-toolbarContainer': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        />
      </Box>

      <Drawer
        anchor="right"
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null)
          setSelectedSerial(null)
        }}
      >
        <Box sx={{ width: 420, p: 2, maxWidth: '100vw' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Consultation detail
          </Typography>
          {!selectedId ? null : detailQuery.isLoading ? (
            <Typography variant="body2">Loading…</Typography>
          ) : detailQuery.isError ? (
            <Alert severity="error">{getErrorMessage(detailQuery.error)}</Alert>
          ) : (
            <Stack spacing={1} sx={{ typography: 'body2' }}>
              {selectedSerial != null ? (
                <div>
                  <strong>#</strong> {selectedSerial}
                </div>
              ) : null}
              <div>
                <strong>Patient:</strong>{' '}
                {patientField(detailQuery.data?.item ?? ({} as Consultation), 'name') || '—'}
              </div>
              <div>
                <strong>Age:</strong>{' '}
                {patientAgeLabel(detailQuery.data?.item ?? ({} as Consultation))}
              </div>
              <div>
                <strong>Phone:</strong>{' '}
                {patientField(detailQuery.data?.item ?? ({} as Consultation), 'phone') || '—'}
              </div>
              <div>
                <strong>State:</strong> {detailQuery.data?.item.state}
              </div>
              <div>
                <strong>Severity:</strong> {detailQuery.data?.item.severity || '—'}
              </div>
              <div>
                <strong>Booking code:</strong> {detailQuery.data?.item.bookingCode || '—'}
              </div>
              <div>
                <strong>Payment ID:</strong>{' '}
                {detailQuery.data?.item.mercadoPagoPaymentId || '—'}
              </div>
              <div>
                <strong>AI summary:</strong>
                <Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {detailQuery.data?.item.aiSummary || '—'}
                </Box>
              </div>
            </Stack>
          )}
          <Button
            sx={{ mt: 2 }}
            onClick={() => {
              setSelectedId(null)
              setSelectedSerial(null)
            }}
            fullWidth
            variant="outlined"
          >
            Close
          </Button>
        </Box>
      </Drawer>
    </Stack>
  )
}
