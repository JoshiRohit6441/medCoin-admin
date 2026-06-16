import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import DetailDrawer from '../../components/layout/DetailDrawer'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useAppToast } from '../../hooks/useAppToast'
import {
  useGetTransactionQuery,
  useGetTransactionStatsQuery,
  useListTransactionsQuery,
  useMockCompleteTransactionPaymentMutation,
  useSyncTransactionPaymentMutation,
} from '../../store/api/medcoinAdminApi'
import type { Transaction } from '../../types/admin'
import {
  consultationStateChipColor,
  consultationStateLabel,
} from '../../utils/consultationState'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
import { formatDateTime, buildDateRangeParams } from '../../utils/dateFormat'
import { getErrorMessage } from '../../utils/errorMessage'
import { pageButtonProps, pageDataGridCellSx, pageDataGridDefaults, pageDrawerCloseSx, pageStatusChipSx } from '../../utils/pageButtons'
import { serialColumn, withSerialNumbers } from '../../utils/gridSerial'

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

function patientAge(item: Transaction): string {
  const p = item.patient
  if (p && typeof p === 'object' && 'age' in p && p.age != null) return String(p.age)
  return '—'
}

export default function TransactionsPage() {
  const isMobile = useIsMobile()
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ])
  const [quickFilter, setQuickFilter] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const sort = sortModel[0]
  const dateParams = buildDateRangeParams(createdFrom, createdTo)
  const { data: stats } = useGetTransactionStatsQuery(dateParams)
  const { data, isLoading, isError, error, refetch, isFetching } =
    useListTransactionsQuery({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      sortBy: sort?.field ?? 'updatedAt',
      sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
      search: quickFilter || undefined,
      paymentStatus: paymentStatus || undefined,
      ...dateParams,
    })

  const detailQuery = useGetTransactionQuery(selectedId ?? '', { skip: !selectedId })
  const [syncPayment, syncState] = useSyncTransactionPaymentMutation()
  const [mockCompletePayment, mockCompleteState] = useMockCompleteTransactionPaymentMutation()
  const devMode = import.meta.env.DEV

  async function handleSyncPayment(id: string) {
    try {
      await syncPayment(id).unwrap()
      showSuccess('Payment synced from Mercado Pago.')
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function handleMockCompletePayment(id: string) {
    try {
      await mockCompletePayment(id).unwrap()
      showSuccess('Payment marked complete. Calendly link sent on WhatsApp.')
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

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
        type: 'string',
        renderCell: (params) => formatDateTime(params.value),
      },
      {
        field: 'paymentStatusLabel',
        headerName: 'Payment',
        minWidth: 148,
        width: 148,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={pageDataGridCellSx}>
            <Chip
              size="small"
              label={row.paymentStatusLabel}
              color={paymentChipColor(row.paymentStatus)}
              variant="outlined"
              sx={pageStatusChipSx}
            />
          </Box>
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
  const hasActiveFilters = Boolean(quickFilter || createdFrom || createdTo || paymentStatus)

  function resetFilters() {
    setQuickFilter('')
    setCreatedFrom('')
    setCreatedTo('')
    setPaymentStatus('')
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Transactions
        </Typography>
        <Button {...pageButtonProps} onClick={() => refetch()} disabled={isFetching}>
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

      <ListFilterBar
        search={quickFilter}
        onSearchChange={(value) => {
          setQuickFilter(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        searchPlaceholder="Search patient, booking code, or payment ID"
        from={createdFrom}
        to={createdTo}
        onFromChange={(value) => {
          setCreatedFrom(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        onToChange={(value) => {
          setCreatedTo(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        onReset={resetFilters}
        resetDisabled={!hasActiveFilters}
      >
        <FormControl size="small" fullWidth sx={{ gridColumn: { xs: '1', sm: 'span 2', md: 'span 1' } }}>
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
      </ListFilterBar>

      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}

      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={
            isMobile
              ? {
                  __serial: false,
                  mercadoPagoPaymentId: false,
                  mercadoPagoStatus: false,
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
          onRowClick={(params) => {
            setSelectedId(String(params.id))
            setSelectedSerial(Number(params.row.__serial) || null)
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          {...pageDataGridDefaults}
          disableRowSelectionOnClick
          sx={dataGridSx}
        />
      </Box>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null)
          setSelectedSerial(null)
        }}
        title="Transaction detail"
      >
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
                <strong>Session:</strong>{' '}
                <Chip
                  size="small"
                  label={consultationStateLabel(item.state)}
                  color={consultationStateChipColor(item.state)}
                  variant="outlined"
                  sx={{ ml: 0.5, verticalAlign: 'middle' }}
                />
              </div>
              <div>
                <strong>Session ID:</strong> {item.sessionId || item._id}
              </div>
              <div>
                <strong>Name:</strong> {patientField(item, 'name') || '—'}
              </div>
              <div>
                <strong>Phone:</strong> {patientField(item, 'phone') || '—'}
              </div>
              <div>
                <strong>Age:</strong> {patientAge(item)}
              </div>
              <div>
                <strong>Severity:</strong> {item.severity || '—'}
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
                <strong>Appointment:</strong> {formatDateTime(item.appointmentStartAt)}
                {item.appointmentEndAt
                  ? ` – ${formatDateTime(item.appointmentEndAt)}`
                  : ''}
              </div>
              <div>
                <strong>Calendly invitee:</strong>{' '}
                {item.calendlyInviteeName || item.calendlyInviteeEmail
                  ? `${item.calendlyInviteeName || '—'}${item.calendlyInviteeEmail ? ` (${item.calendlyInviteeEmail})` : ''}`
                  : '—'}
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
                <strong>Consultancy suggestion:</strong>
                <Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {item.suggestedConsultancyText || '—'}
                </Box>
              </div>
              <div>
                <strong>Created:</strong> {formatDateTime(item.createdAt)}
              </div>
              <div>
                <strong>Updated:</strong> {formatDateTime(item.updatedAt)}
              </div>
              <div>
                <strong>Last activity:</strong> {formatDateTime(item.lastActivityAt)}
              </div>
              <div>
                <strong>AI summary:</strong>
                <Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
                  {item.aiSummary || '—'}
                </Box>
              </div>
              {item.paymentStatus === 'processing' ? (
                <Button
                  {...pageButtonProps}
                  disabled={syncState.isLoading}
                  onClick={() => {
                    if (selectedId) void handleSyncPayment(selectedId)
                  }}
                >
                  Sync payment from Mercado Pago
                </Button>
              ) : null}
              {devMode && item.paymentStatus === 'awaiting' ? (
                <>
                  <Alert severity="info" sx={{ mt: 0.5 }}>
                    Development only — skips Mercado Pago sandbox and sends the Calendly link on
                    WhatsApp.
                  </Alert>
                  <Button
                    {...pageButtonProps}
                    color="warning"
                    disabled={mockCompleteState.isLoading}
                    onClick={() => {
                      if (selectedId) void handleMockCompletePayment(selectedId)
                    }}
                  >
                    {mockCompleteState.isLoading
                      ? 'Marking complete…'
                      : 'Mark payment completed (dev)'}
                  </Button>
                </>
              ) : null}
            </Stack>
          ) : null}
          <Button
            {...pageButtonProps}
            fullWidth
            sx={pageDrawerCloseSx}
            onClick={() => setSelectedId(null)}
          >
            Close
          </Button>
      </DetailDrawer>
      <ToastHost />
    </Stack>
  )
}
