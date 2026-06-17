import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SEARCH_DEBOUNCE_MS } from '../../constants/searchDebounce'
import DetailDrawer from '../../components/layout/DetailDrawer'
import { DetailDrawerSkeleton } from '../../components/layout/AppSkeletons'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useIsMobile } from '../../hooks/useBreakpoint'
import {
  useGetConsultationQuery,
  useListConsultationsQuery,
} from '../../store/api/medcoinAdminApi'
import type { Consultation } from '../../types/admin'
import {
  ACTIVE_SESSION_STATES,
  ACTIVE_SESSION_STATE_LIST,
  COMPLETED_FLOW_STATES,
  consultationStatusChipColor,
  consultationStatusLabel,
  isActiveSessionStateFilter,
} from '../../utils/consultationState'
import { formatPatientAge } from '../../utils/patientDisplay'
import { dataGridHeight, dataGridSx, useResponsiveColumnVisibility } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import { buildDateRangeParams } from '../../utils/dateFormat'
import {
  consultationPaymentChipColor,
  consultationPaymentStatusLabel,
} from '../../utils/consultationPayment'
import { pageButtonProps, pageDataGridCellSx, pageDataGridDefaults, pageDrawerCloseSx, pageStatusChipSx } from '../../utils/pageButtons'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const SEVERITIES = ['', 'Low', 'Medium', 'High'] as const

type StatusPreset = 'all' | 'active' | 'completed' | 'expired'

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
  if (p && typeof p === 'object' && 'age' in p) {
    return formatPatientAge((p as { age?: number }).age)
  }
  return '—'
}

function resolveStatusPreset(stateFilter: string): StatusPreset {
  if (!stateFilter) return 'all'
  if (isActiveSessionStateFilter(stateFilter)) return 'active'
  if (stateFilter === 'EXPIRED') return 'expired'
  if (stateFilter === COMPLETED_FLOW_STATES) return 'completed'

  const parts = stateFilter.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 1) {
    if (parts[0] === 'EXPIRED') return 'expired'
    if (['COMPLETED', 'BOOKED', 'DOCTOR_NOTIFIED'].includes(parts[0])) return 'completed'
    if (ACTIVE_SESSION_STATE_LIST.includes(parts[0] as (typeof ACTIVE_SESSION_STATE_LIST)[number])) {
      return 'active'
    }
  }

  return 'all'
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
    headerName: 'Status',
    minWidth: 132,
    width: 132,
    sortable: false,
    renderCell: ({ value }) => {
      const state = String(value || '')
      return (
        <Box sx={pageDataGridCellSx}>
          <Chip
            size="small"
            label={consultationStatusLabel(state)}
            color={consultationStatusChipColor(state)}
            variant="outlined"
            sx={pageStatusChipSx}
          />
        </Box>
      )
    },
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
    field: 'paymentStatus',
    headerName: 'Payment',
    minWidth: 108,
    width: 108,
    sortable: false,
    valueGetter: (_v, row) => consultationPaymentStatusLabel(row),
    renderCell: ({ row }) => (
      <Box sx={pageDataGridCellSx}>
        <Chip
          size="small"
          label={consultationPaymentStatusLabel(row)}
          color={consultationPaymentChipColor(row)}
          variant="outlined"
          sx={pageStatusChipSx}
        />
      </Box>
    ),
  },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    minWidth: 180,
    flex: 0.4,
    type: 'string',
    renderCell: (params) => formatDateTime(params.value),
  },
]

const MOBILE_CONSULTATION_COLUMN_VISIBILITY = {
  __serial: false,
  patientAge: false,
  patientPhone: false,
  bookingCode: false,
  paymentStatus: false,
  updatedAt: false,
} as const

export default function ConsultationsPage() {
  const isMobile = useIsMobile()
  const { columnVisibilityModel, onColumnVisibilityModelChange } =
    useResponsiveColumnVisibility(MOBILE_CONSULTATION_COLUMN_VISIBILITY)
  const [searchParams, setSearchParams] = useSearchParams()

  const stateFilter = searchParams.get('state') || ''
  const severityFilter = searchParams.get('severity') || ''
  const paymentStatusFilter = searchParams.get('paymentStatus') || ''
  const searchQuery = searchParams.get('search') || ''

  const statusPreset = resolveStatusPreset(stateFilter)

  const [searchInput, setSearchInput] = useState(searchQuery)
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (searchParams.get('activeOnly') === 'true' && !searchParams.get('state')) {
      const params = new URLSearchParams(searchParams)
      params.delete('activeOnly')
      params.set('state', ACTIVE_SESSION_STATES)
      setSearchParams(params, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }, [stateFilter, severityFilter, paymentStatusFilter, searchQuery, createdFrom, createdTo])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed === searchQuery) return
      updateParams({ search: trimmed || null })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, searchQuery, updateParams])

  const applyStatusPreset = useCallback(
    (preset: StatusPreset) => {
      if (preset === 'all') {
        updateParams({ activeOnly: null, state: null })
        return
      }
      if (preset === 'active') {
        updateParams({ activeOnly: null, state: ACTIVE_SESSION_STATES })
        return
      }
      if (preset === 'completed') {
        updateParams({ activeOnly: null, state: COMPLETED_FLOW_STATES })
        return
      }
      if (preset === 'expired') {
        updateParams({ activeOnly: null, state: 'EXPIRED' })
      }
    },
    [updateParams]
  )

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setCreatedFrom('')
    setCreatedTo('')
    updateParams({ activeOnly: null, state: null, severity: null, paymentStatus: null, search: null })
  }, [updateParams])

  const sort = sortModel[0]
  const { data, isError, error, refetch, isFetching } = useListConsultationsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'updatedAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    search: searchQuery || undefined,
    q: searchQuery || undefined,
    state: stateFilter || undefined,
    severity: severityFilter || undefined,
    paymentStatus:
      paymentStatusFilter === 'paid' || paymentStatusFilter === 'unpaid'
        ? paymentStatusFilter
        : undefined,
    ...buildDateRangeParams(createdFrom, createdTo),
  })

  const detailQuery = useGetConsultationQuery(selectedId ?? '', { skip: !selectedId })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const hasActiveFilters =
    Boolean(stateFilter) ||
    Boolean(severityFilter) ||
    Boolean(paymentStatusFilter) ||
    Boolean(searchQuery) ||
    Boolean(createdFrom) ||
    Boolean(createdTo)

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (statusPreset === 'active') parts.push('Status: Active')
    else if (statusPreset === 'completed') parts.push('Status: Completed')
    else if (statusPreset === 'expired') parts.push('Status: Expired')
    if (severityFilter) parts.push(`Severity: ${severityFilter}`)
    if (paymentStatusFilter === 'paid') parts.push('Payment: Paid')
    else if (paymentStatusFilter === 'unpaid') parts.push('Payment: Unpaid')
    if (searchQuery) parts.push(`Search: "${searchQuery}"`)
    if (createdFrom || createdTo) {
      parts.push(`Created: ${createdFrom || '…'} – ${createdTo || '…'}`)
    }
    return parts.join(' · ')
  }, [statusPreset, severityFilter, paymentStatusFilter, searchQuery, createdFrom, createdTo])

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Consultations
        </Typography>
        <Button {...pageButtonProps} onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>

      <ListFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Name, phone, or booking code"
        from={createdFrom}
        to={createdTo}
        onFromChange={setCreatedFrom}
        onToChange={setCreatedTo}
        onReset={clearFilters}
        resetDisabled={!hasActiveFilters}
      />

      {/* <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          label="All"
          variant={statusPreset === 'all' && !severityFilter && !searchQuery ? 'filled' : 'outlined'}
          onClick={() => applyStatusPreset('all')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Active"
          color="primary"
          variant={statusPreset === 'active' ? 'filled' : 'outlined'}
          onClick={() => applyStatusPreset('active')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Completed"
          color="success"
          variant={statusPreset === 'completed' ? 'filled' : 'outlined'}
          onClick={() => applyStatusPreset('completed')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Expired"
          variant={statusPreset === 'expired' ? 'filled' : 'outlined'}
          onClick={() => applyStatusPreset('expired')}
          sx={{ cursor: 'pointer' }}
        />
      </Stack> */}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
        }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="consultations-status-label">Status</InputLabel>
          <Select
            labelId="consultations-status-label"
            label="Status"
            value={statusPreset}
            onChange={(e) => applyStatusPreset(e.target.value as StatusPreset)}
          >
            <MenuItem value="all">All consultations</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Severity</InputLabel>
          <Select
            label="Severity"
            value={severityFilter}
            onChange={(e) => updateParams({ severity: e.target.value || null })}
          >
            <MenuItem value="">All</MenuItem>
            {SEVERITIES.filter(Boolean).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel id="consultations-payment-label">Payment status</InputLabel>
          <Select
            labelId="consultations-payment-label"
            label="Payment status"
            value={paymentStatusFilter}
            onChange={(e) =>
              updateParams({ paymentStatus: e.target.value || null })
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {hasActiveFilters ? (
        <Alert severity="info" sx={{ py: 0.25 }}>
          {filterSummary || 'Filters applied'} · {data?.pagination.total ?? 0} result
          {(data?.pagination.total ?? 0) === 1 ? '' : 's'}
        </Alert>
      ) : null}

      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          getRowId={(r) => r._id}
          loading={isFetching}
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
          pageSizeOptions={[10, 25, 50]}
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
        title="Consultation detail"
      >
        {!selectedId ? null : detailQuery.isLoading ? (
          <DetailDrawerSkeleton rows={10} />
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
              <strong>Payment status:</strong>{' '}
              {detailQuery.data?.item
                ? consultationPaymentStatusLabel(detailQuery.data.item)
                : '—'}
            </div>
            <div>
              <strong>Status:</strong> {consultationStatusLabel(detailQuery.data?.item.state)}
            </div>
            <div>
              <strong>Severity:</strong> {detailQuery.data?.item.severity || '—'}
            </div>
            <div>
              <strong>Booking code:</strong> {detailQuery.data?.item.bookingCode || '—'}
            </div>
            <div>
              <strong>Payment ID:</strong> {detailQuery.data?.item.mercadoPagoPaymentId || '—'}
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
          {...pageButtonProps}
          fullWidth
          sx={pageDrawerCloseSx}
          onClick={() => {
            setSelectedId(null)
            setSelectedSerial(null)
          }}
        >
          Close
        </Button>
      </DetailDrawer>
    </Stack>
  )
}
