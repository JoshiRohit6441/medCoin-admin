import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import {
  useGetTransactionQuery,
  useGetTransactionStatsQuery,
  useListTransactionsQuery,
  useSyncTransactionPaymentMutation,
} from '../../store/api/medcoinAdminApi'
import type { Transaction } from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
import { serialColumn, withSerialNumbers } from '../../utils/gridSerial'

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ gap: 1, px: 1, py: 1 }}>
      <GridToolbarQuickFilter debounceMs={400} />
    </GridToolbarContainer>
  )
}

function patientField(row: Transaction, key: 'phone' | 'name'): string {
  const p = row.patient
  if (!p) return ''
  const v = p[key]
  return v != null ? String(v) : ''
}

function paymentChipColor(
  status: Transaction['paymentStatus']
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'approved':
    case 'mock':
      return 'success'
    case 'processing':
    case 'awaiting':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
}

function formatDt(v: unknown) {
  if (!v) return '—'
  try {
    return new Date(String(v)).toLocaleString()
  } catch {
    return String(v)
  }
}

export default function TransactionsPage() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ])
  const [quickFilter, setQuickFilter] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const sort = sortModel[0]
  const { data: stats } = useGetTransactionStatsQuery()
  const { data, isLoading, isError, error, refetch, isFetching } =
    useListTransactionsQuery({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      sortBy: sort?.field ?? 'updatedAt',
      sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
      search: quickFilter || undefined,
      paymentStatus: paymentStatus || undefined,
    })

  const detailQuery = useGetTransactionQuery(selectedId ?? '', { skip: !selectedId })
  const [syncPayment, syncState] = useSyncTransactionPaymentMutation()

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const columns: GridColDef<Transaction>[] = useMemo(
    () => [
      serialColumn(),
      {
        field: 'updatedAt',
        headerName: 'Updated',
        minWidth: 160,
        flex: 0.45,
        valueFormatter: (v) => formatDt(v),
      },
      {
        field: 'paymentStatusLabel',
        headerName: 'Payment',
        minWidth: 130,
        flex: 0.35,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.paymentStatusLabel}
            color={paymentChipColor(row.paymentStatus)}
            variant="outlined"
          />
        ),
      },
      {
        field: 'amountLabel',
        headerName: 'Amount',
        width: 100,
        valueFormatter: (v) => (v ? String(v) : '—'),
      },
      {
        field: 'patientName',
        headerName: 'Patient',
        minWidth: 120,
        sortable: false,
        valueGetter: (_v, row) => patientField(row, 'name') || '—',
      },
      {
        field: 'patientPhone',
        headerName: 'Phone',
        minWidth: 120,
        sortable: false,
        valueGetter: (_v, row) => patientField(row, 'phone'),
      },
      {
        field: 'state',
        headerName: 'Session',
        minWidth: 140,
        flex: 0.35,
      },
      {
        field: 'mercadoPagoPaymentId',
        headerName: 'MP payment ID',
        minWidth: 120,
        flex: 0.3,
        valueFormatter: (v) => (v ? String(v).slice(0, 12) + '…' : '—'),
      },
      {
        field: 'mercadoPagoStatus',
        headerName: 'MP status',
        width: 110,
        valueFormatter: (v) => (v ? String(v) : '—'),
      },
      {
        field: 'bookingCode',
        headerName: 'Booking',
        width: 100,
      },
    ],
    []
  )

  const item = detailQuery.data?.item

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Transactions
        </Typography>
        <Button size="small" variant="outlined" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>

      {stats ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
          }}
        >
          {[
            ['Approved', stats.counts.approved],
            ['Processing', stats.counts.processing],
            ['Awaiting pay', stats.counts.paymentPending],
            ['With MP ID', stats.counts.withPayment],
            ['Est. revenue', stats.revenueEstimate.label ?? stats.revenueEstimate.amount],
          ].map(([label, value]) => (
            <Box
              key={String(label)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 1.5,
                py: 1,
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {value ?? '—'}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Payment status</InputLabel>
        <Select
          label="Payment status"
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="processing">Processing</MenuItem>
          <MenuItem value="awaiting">Awaiting payment</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="mock">Mock</MenuItem>
          <MenuItem value="none">No payment</MenuItem>
        </Select>
      </FormControl>

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
          pageSizeOptions={[10, 25, 50, 100]}
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
        <Box sx={{ width: 440, p: 2, maxWidth: '100vw' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Transaction detail
          </Typography>
          {!selectedId ? null : detailQuery.isLoading ? (
            <Typography variant="body2">Loading…</Typography>
          ) : detailQuery.isError ? (
            <Alert severity="error">{getErrorMessage(detailQuery.error)}</Alert>
          ) : item ? (
            <Stack spacing={1.5} sx={{ typography: 'body2' }}>
              {selectedSerial != null ? (
                <div>
                  <strong>#</strong> {selectedSerial}
                </div>
              ) : null}
              <Chip
                size="small"
                label={item.paymentStatusLabel}
                color={paymentChipColor(item.paymentStatus)}
                sx={{ alignSelf: 'flex-start' }}
              />
              <div>
                <strong>Session:</strong> {item.state}
              </div>
              <div>
                <strong>Name:</strong> {patientField(item, 'name') || '—'}
              </div>
              <div>
                <strong>Phone:</strong> {patientField(item, 'phone') || '—'}
              </div>
              <div>
                <strong>Amount:</strong> {item.amountLabel ?? '—'}
              </div>
              <div>
                <strong>MP payment ID:</strong> {item.mercadoPagoPaymentId || '—'}
              </div>
              <div>
                <strong>MP status:</strong> {item.mercadoPagoStatus || '—'}
                {item.mercadoPagoStatusDetail
                  ? ` (${item.mercadoPagoStatusDetail})`
                  : ''}
              </div>
              <div>
                <strong>MP method:</strong> {item.mercadoPagoPaymentMethod || '—'}
              </div>
              <div>
                <strong>Preference ID:</strong> {item.mercadoPagoPreferenceId || '—'}
              </div>
              <div>
                <strong>Booking code:</strong> {item.bookingCode || '—'}
              </div>
              <div>
                <strong>Appointment:</strong> {formatDt(item.appointmentStartAt)}
              </div>
              <div>
                <strong>Meet link:</strong>{' '}
                {item.appointmentMeetingUrl ? (
                  <a href={item.appointmentMeetingUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <strong>Payment URL:</strong>{' '}
                {item.paymentUrl ? (
                  <a href={item.paymentUrl} target="_blank" rel="noreferrer">
                    Link
                  </a>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <strong>AI summary:</strong>
                <Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
                  {item.aiSummary || '—'}
                </Box>
              </div>
              {(item.paymentStatus === 'processing' ||
                item.paymentStatus === 'awaiting') && (
                <Button
                  size="small"
                  variant="contained"
                  disabled={syncState.isLoading}
                  onClick={() => {
                    if (selectedId) void syncPayment(selectedId)
                  }}
                >
                  Sync payment from Mercado Pago
                </Button>
              )}
            </Stack>
          ) : null}
          <Button sx={{ mt: 2 }} onClick={() => setSelectedId(null)} fullWidth variant="outlined">
            Close
          </Button>
        </Box>
      </Drawer>
    </Stack>
  )
}
