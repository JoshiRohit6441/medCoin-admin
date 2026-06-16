import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
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
  TextField,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DetailDrawer from '../../components/layout/DetailDrawer'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useAppToast } from '../../hooks/useAppToast'
import {
  useGetConsultationQuery,
  useGetMeetingsSummaryQuery,
  useListMeetingsQuery,
} from '../../store/api/medcoinAdminApi'
import type { Consultation, DoctorMeeting } from '../../types/admin'
import { formatPatientAge } from '../../utils/patientDisplay'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import { buildDateRangeParams } from '../../utils/dateFormat'
import { pageButtonProps, pageDataGridCellSx, pageDataGridDefaults, pageDrawerCloseSx, pageStatusChipSx, pageTableActionStackSx } from '../../utils/pageButtons'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const SEVERITIES = ['', 'Low', 'Medium', 'High'] as const

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

function timingChip(row: DoctorMeeting) {
  const t = row.meetingTiming
  if (t === 'upcoming') {
    return (
      <Chip label="Upcoming" size="small" color="success" variant="outlined" sx={pageStatusChipSx} />
    )
  }
  if (t === 'past') {
    return (
      <Chip label="Completed" size="small" color="success" variant="outlined" sx={pageStatusChipSx} />
    )
  }
  return <Chip label="—" size="small" variant="outlined" sx={pageStatusChipSx} />
}

function MeetLinkActions({
  url,
  onCopied,
}: {
  url: string
  onCopied: () => void
}) {
  async function copyLink(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      onCopied()
    } catch {
      /* ignore */
    }
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={pageTableActionStackSx}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        {...pageButtonProps}
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
      >
        Open
      </Button>
      <Button
        {...pageButtonProps}
        startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(e) => void copyLink(e)}
      >
        Copy
      </Button>
    </Stack>
  )
}

export default function MeetingsPage() {
  const isMobile = useIsMobile()
  const { showSuccess, Host: ToastHost } = useAppToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTiming = searchParams.get('timing') === 'past' ? 'past' : searchParams.get('timing') === 'upcoming' ? 'upcoming' : 'all'

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'appointmentStartAt', sort: 'asc' },
  ])
  const [timing, setTiming] = useState<'all' | 'upcoming' | 'past'>(initialTiming)
  const [severity, setSeverity] = useState('')
  const [state, setState] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [bookingCode, setBookingCode] = useState('')
  const [appointmentFrom, setAppointmentFrom] = useState('')
  const [appointmentTo, setAppointmentTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const notifyLinkCopied = useCallback(() => {
    showSuccess('Meeting link copied to clipboard')
  }, [showSuccess])

  async function copyMeetingLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      notifyLinkCopied()
    } catch {
      /* ignore */
    }
  }

  const sort = sortModel[0]
  const { data: summary } = useGetMeetingsSummaryQuery()
  const { data, isLoading, isError, error, refetch, isFetching } = useListMeetingsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'appointmentStartAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'asc',
    timing: timing === 'all' ? undefined : timing,
    severity: severity || undefined,
    state: state || undefined,
    search: patientSearch.trim() || undefined,
    bookingCode: bookingCode.trim() || undefined,
    appointmentFrom: buildDateRangeParams(appointmentFrom, appointmentTo, 'appointment').appointmentFrom,
    appointmentTo: buildDateRangeParams(appointmentFrom, appointmentTo, 'appointment').appointmentTo,
  })

  const detailQuery = useGetConsultationQuery(selectedId ?? '', { skip: !selectedId })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const columns: GridColDef<DoctorMeeting & { __serial: number }>[] = useMemo(
    () => [
      serialColumn(),
      {
        field: 'meetingTiming',
        headerName: 'When',
        minWidth: 120,
        width: 120,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={pageDataGridCellSx}>{timingChip(row)}</Box>
        ),
      },
      {
        field: 'patientName',
        headerName: 'Patient',
        minWidth: 140,
        flex: 0.5,
        valueGetter: (_v, row) => patientField(row, 'name') || '—',
      },
      {
        field: 'patientAge',
        headerName: 'Age',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_v, row) => patientAgeLabel(row),
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 96,
      },
      {
        field: 'appointmentStartAt',
        headerName: 'Appointment',
        minWidth: 168,
        flex: 0.45,
        type: 'string',
        renderCell: (params) => formatDateTime(params.value),
      },
      {
        field: 'state',
        headerName: 'State',
        minWidth: 140,
        flex: 0.35,
      },
      {
        field: 'bookingCode',
        headerName: 'Code',
        width: 108,
      },
      {
        field: 'appointmentMeetingUrl',
        headerName: 'Meet',
        minWidth: 176,
        width: 176,
        sortable: false,
        renderCell: ({ value }) => {
          const url = String(value || '').trim()
          return url ? (
            <Box sx={pageDataGridCellSx}>
              <MeetLinkActions url={url} onCopied={notifyLinkCopied} />
            </Box>
          ) : (
            '—'
          )
        },
      },
    ],
    [notifyLinkCopied]
  )

  function applyTimingFilter(next: 'all' | 'upcoming' | 'past') {
    setTiming(next)
    setPaginationModel((p) => ({ ...p, page: 0 }))
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('timing')
    else params.set('timing', next)
    setSearchParams(params, { replace: true })
  }

  const hasActiveFilters = Boolean(
    patientSearch.trim() ||
      severity ||
      state ||
      bookingCode.trim() ||
      appointmentFrom ||
      appointmentTo ||
      timing !== 'all'
  )

  function resetFilters() {
    setPatientSearch('')
    setSeverity('')
    setState('')
    setBookingCode('')
    setAppointmentFrom('')
    setAppointmentTo('')
    applyTimingFilter('all')
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <EventAvailableOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Doctor meetings
        </Typography>
        <Button {...pageButtonProps} onClick={() => void refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          label={`Upcoming: ${summary?.upcoming ?? '—'}`}
          color="success"
          variant={timing === 'upcoming' ? 'filled' : 'outlined'}
          onClick={() => applyTimingFilter('upcoming')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Completed: ${summary?.past ?? '—'}`}
          color="success"
          variant={timing === 'past' ? 'filled' : 'outlined'}
          onClick={() => applyTimingFilter('past')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`All: ${summary?.total ?? '—'}`}
          variant={timing === 'all' ? 'filled' : 'outlined'}
          onClick={() => applyTimingFilter('all')}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>

      <ListFilterBar
        search={patientSearch}
        onSearchChange={(value) => {
          setPatientSearch(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        searchLabel="Patient name or phone"
        searchPlaceholder="Name or phone number"
        from={appointmentFrom}
        to={appointmentTo}
        fromLabel="Appointment from"
        toLabel="Appointment to"
        onFromChange={(value) => {
          setAppointmentFrom(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        onToChange={(value) => {
          setAppointmentTo(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        onReset={resetFilters}
        resetDisabled={!hasActiveFilters}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="meetings-timing-label">Timings</InputLabel>
          <Select
            labelId="meetings-timing-label"
            label="Timings"
            value={timing}
            displayEmpty
            renderValue={(selected) => {
              if (selected === 'upcoming') return 'Upcoming'
              if (selected === 'past') return 'Completed (past)'
              return 'All timings'
            }}
            onChange={(e) => applyTimingFilter(e.target.value as typeof timing)}
          >
            <MenuItem value="all">All timings</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="past">Completed (past)</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Severity</InputLabel>
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value)
              setPaginationModel((p) => ({ ...p, page: 0 }))
            }}
          >
            <MenuItem value="">All</MenuItem>
            {SEVERITIES.filter(Boolean).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* <FormControl size="small" fullWidth>
          <InputLabel>State</InputLabel>
          <Select
            label="State"
            value={state}
            onChange={(e) => {
              setState(e.target.value)
              setPaginationModel((p) => ({ ...p, page: 0 }))
            }}
          >
            <MenuItem value="">All</MenuItem>
            {STATES.filter(Boolean).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}
        <TextField
          size="small"
          label="Booking code"
          value={bookingCode}
          onChange={(e) => {
            setBookingCode(e.target.value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          fullWidth
        />
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
                  patientAge: false,
                  severity: false,
                  state: false,
                  bookingCode: false,
                  appointmentMeetingUrl: false,
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
        title="Meeting detail"
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
                <strong>Severity:</strong> {detailQuery.data?.item.severity || '—'}
              </div>
              <div>
                <strong>State:</strong> {detailQuery.data?.item.state}
              </div>
              <div>
                <strong>Appointment:</strong>{' '}
                {formatDateTime(detailQuery.data?.item.appointmentStartAt)}
                {detailQuery.data?.item.appointmentEndAt
                  ? ` – ${formatDateTime(detailQuery.data?.item.appointmentEndAt)}`
                  : ''}
              </div>
              <div>
                <strong>Booking code:</strong> {detailQuery.data?.item.bookingCode || '—'}
              </div>
              {detailQuery.data?.item.appointmentMeetingUrl ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button
                    {...pageButtonProps}
                    component="a"
                    href={detailQuery.data.item.appointmentMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewOutlinedIcon />}
                  >
                    Open Google Meet
                  </Button>
                  <Button
                    {...pageButtonProps}
                    startIcon={<ContentCopyOutlinedIcon />}
                    onClick={() =>
                      void copyMeetingLink(detailQuery.data!.item.appointmentMeetingUrl!)
                    }
                  >
                    Copy meeting link
                  </Button>
                </Stack>
              ) : null}
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

      <ToastHost />
    </Stack>
  )
}
