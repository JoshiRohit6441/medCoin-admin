import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import DetailDrawer from '../../components/layout/DetailDrawer'
import { useIsMobile } from '../../hooks/useBreakpoint'
import {
  useGetConsultationQuery,
  useListConsultationsQuery,
} from '../../store/api/medcoinAdminApi'
import type { Consultation } from '../../types/admin'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
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
  if (p && typeof p === 'object') {
    const v = p[key]
    return v != null ? String(v) : ''
  }
  return ''
}

function patientAgeLabel(row: Consultation): string {
  const p = row.patient
  if (p && typeof p === 'object' && 'age' in p && (p as { age?: number }).age != null) {
    return String((p as { age: number }).age)
  }
  return '—'
}

function TriageConversation({
  messages,
}: {
  messages?: { role: string; content: string }[]
}) {
  const list = (messages ?? []).filter((m) => String(m.content || '').trim())
  if (!list.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No triage messages recorded.
      </Typography>
    )
  }

  return (
    <Stack spacing={1.25}>
      {list.map((m, index) => {
        const isAssistant = m.role === 'assistant'
        return (
          <Box
            key={`${index}-${m.role}`}
            sx={{
              p: 1.25,
              borderRadius: 1,
              bgcolor: isAssistant ? 'grey.50' : 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: isAssistant ? 'primary.main' : 'text.secondary',
                display: 'block',
                mb: 0.5,
              }}
            >
              {isAssistant ? 'Sofia (question)' : 'Patient (answer)'}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {m.content}
            </Typography>
          </Box>
        )
      })}
    </Stack>
  )
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
  const isMobile = useIsMobile()
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
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
      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={
            isMobile
              ? {
                  __serial: false,
                  patientAge: false,
                  patientPhone: false,
                  bookingCode: false,
                  updatedAt: false,
                }
              : undefined
          }
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
          sx={dataGridSx}
        />
      </Box>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null)
          setSelectedSerial(null)
        }}
        title="Consultation detail"
      >
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

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Triage questions &amp; answers
                </Typography>
                <TriageConversation messages={detailQuery.data?.item.messages} />
              </Box>

              <Divider sx={{ my: 1 }} />

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
      </DetailDrawer>
    </Stack>
  )
}
