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
  TextField,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DetailDrawer from '../../components/layout/DetailDrawer'
import { useIsMobile } from '../../hooks/useBreakpoint'
import {
  useGetConsultationQuery,
  useListConsultationsQuery,
} from '../../store/api/medcoinAdminApi'
import type { Consultation } from '../../types/admin'
import {
  ACTIVE_SESSION_STATES,
  COMPLETED_FLOW_STATES,
  CONSULTATION_STATE_OPTIONS,
  consultationStateChipColor,
  consultationStateLabel,
  isActiveSessionStateFilter,
  isHighlightedConsultationState,
} from '../../utils/consultationState'
import { formatPatientAge } from '../../utils/patientDisplay'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const SEVERITIES = ['', 'Low', 'Medium', 'High'] as const

type ViewPreset = 'all' | 'active' | 'completed_flow' | 'expired' | 'custom'

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

function resolveViewPreset(stateFilter: string): ViewPreset {
  if (isActiveSessionStateFilter(stateFilter)) return 'active'
  if (stateFilter === 'EXPIRED') return 'expired'
  if (stateFilter === COMPLETED_FLOW_STATES) return 'completed_flow'
  if (!stateFilter) return 'all'
  return 'custom'
}

function resolveSingleState(stateFilter: string): string {
  if (!stateFilter || stateFilter.includes(',')) return ''
  return stateFilter
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
    renderCell: ({ value }) => {
      const state = String(value || '')
      const highlighted = isHighlightedConsultationState(state)
      return (
        <Chip
          size="small"
          label={consultationStateLabel(state)}
          color={consultationStateChipColor(state)}
          variant={highlighted ? 'filled' : 'outlined'}
          sx={{
            fontWeight: highlighted ? 700 : 500,
            maxWidth: '100%',
            ...(highlighted
              ? {
                  boxShadow: '0 0 0 1px rgba(234, 88, 12, 0.25)',
                }
              : {}),
          }}
        />
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
    field: 'updatedAt',
    headerName: 'Updated',
    minWidth: 180,
    flex: 0.4,
    type: 'string',
    renderCell: (params) => formatDateTime(params.value),
  },
]

export default function ConsultationsPage() {
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()

  const stateFilter = searchParams.get('state') || ''
  const severityFilter = searchParams.get('severity') || ''
  const searchQuery = searchParams.get('search') || ''

  const viewPreset = resolveViewPreset(stateFilter)
  const singleState = resolveSingleState(stateFilter)

  const [searchInput, setSearchInput] = useState(searchQuery)
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
  }, [stateFilter, severityFilter, searchQuery])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed === searchQuery) return
      updateParams({ search: trimmed || null })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchInput, searchQuery, updateParams])

  const applyViewPreset = useCallback(
    (preset: ViewPreset) => {
      if (preset === 'all') {
        updateParams({ activeOnly: null, state: null })
        return
      }
      if (preset === 'active') {
        updateParams({ activeOnly: null, state: ACTIVE_SESSION_STATES })
        return
      }
      if (preset === 'completed_flow') {
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
    updateParams({ activeOnly: null, state: null, severity: null, search: null })
  }, [updateParams])

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListConsultationsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'updatedAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    search: searchQuery || undefined,
    q: searchQuery || undefined,
    state: stateFilter || undefined,
    severity: severityFilter || undefined,
  })

  const detailQuery = useGetConsultationQuery(selectedId ?? '', { skip: !selectedId })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const hasActiveFilters =
    Boolean(stateFilter) ||
    Boolean(severityFilter) ||
    Boolean(searchQuery)

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (viewPreset === 'active') parts.push('Active sessions')
    else if (viewPreset === 'completed_flow') parts.push('Completed flow')
    else if (viewPreset === 'expired') parts.push('Expired')
    else if (viewPreset === 'custom' && stateFilter) {
      parts.push(
        stateFilter
          .split(',')
          .map(consultationStateLabel)
          .join(', ')
      )
    }
    if (severityFilter) parts.push(`Severity: ${severityFilter}`)
    if (searchQuery) parts.push(`Search: "${searchQuery}"`)
    return parts.join(' · ')
  }, [viewPreset, stateFilter, severityFilter, searchQuery])

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

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          label="All"
          variant={viewPreset === 'all' && !severityFilter && !searchQuery ? 'filled' : 'outlined'}
          onClick={() => applyViewPreset('all')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Active sessions"
          color="primary"
          variant={viewPreset === 'active' ? 'filled' : 'outlined'}
          onClick={() => applyViewPreset('active')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Completed flow"
          color="success"
          variant={viewPreset === 'completed_flow' ? 'filled' : 'outlined'}
          onClick={() => applyViewPreset('completed_flow')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Expired"
          variant={viewPreset === 'expired' ? 'filled' : 'outlined'}
          onClick={() => applyViewPreset('expired')}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        <TextField
          size="small"
          label="Search"
          placeholder="Name, phone, or booking code"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
        />
        <FormControl size="small" fullWidth>
          <InputLabel id="consultations-view-label">View</InputLabel>
          <Select
            labelId="consultations-view-label"
            label="View"
            value={viewPreset === 'custom' ? 'custom' : viewPreset}
            onChange={(e) => {
              const next = e.target.value as ViewPreset
              if (next !== 'custom') applyViewPreset(next)
            }}
          >
            <MenuItem value="all">All consultations</MenuItem>
            <MenuItem value="active">Active sessions</MenuItem>
            <MenuItem value="completed_flow">Completed flow</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            {viewPreset === 'custom' ? (
              <MenuItem value="custom" disabled>
                Custom state filter
              </MenuItem>
            ) : null}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>State</InputLabel>
          <Select
            label="State"
            value={singleState}
            onChange={(e) => {
              const next = e.target.value
              updateParams({
                activeOnly: null,
                state: next || null,
              })
            }}
          >
            <MenuItem value="">All states</MenuItem>
            {CONSULTATION_STATE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
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
      </Box>

      {hasActiveFilters ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Alert severity="info" sx={{ py: 0.25, flex: 1, minWidth: 200 }}>
            {filterSummary || 'Filters applied'} · {data?.pagination.total ?? 0} result
            {(data?.pagination.total ?? 0) === 1 ? '' : 's'}
          </Alert>
          <Button size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        </Stack>
      ) : null}

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
          onRowClick={(params) => {
            setSelectedId(String(params.id))
            setSelectedSerial(Number(params.row.__serial) || null)
          }}
          pageSizeOptions={[10, 25, 50]}
          density="compact"
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
              <strong>State:</strong> {consultationStateLabel(detailQuery.data?.item.state)}
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
