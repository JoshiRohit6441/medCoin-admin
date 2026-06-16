import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DetailDrawer from '../../components/layout/DetailDrawer'
import DateFilterField from '../../components/forms/DateFilterField'
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
import { isValidDateInputValue } from '../../utils/dateFormat'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const SEVERITIES = ['', 'Low', 'Medium', 'High'] as const
const STATES = [
  '',
  'BOOKED',
  'DOCTOR_NOTIFIED',
  'COMPLETED',
  'PAID',
  'BOOKING_PENDING',
] as const

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
  if (t === 'upcoming') return <Chip label="Upcoming" size="small" color="success" variant="outlined" />
  if (t === 'past') return <Chip label="Completed" size="small" color="default" variant="outlined" />
  return <Chip label="—" size="small" variant="outlined" />
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
      spacing={0.25}
      sx={{ alignItems: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="Open meeting">
        <IconButton
          size="small"
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open meeting link"
        >
          <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy meeting link">
        <IconButton size="small" onClick={(e) => void copyLink(e)} aria-label="Copy meeting link">
          <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
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
    appointmentFrom: isValidDateInputValue(appointmentFrom) && appointmentFrom ? appointmentFrom : undefined,
    appointmentTo: isValidDateInputValue(appointmentTo) && appointmentTo ? appointmentTo : undefined,
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
        width: 110,
        sortable: false,
        renderCell: ({ row }) => timingChip(row),
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
        width: 88,
        sortable: false,
        renderCell: ({ value }) => {
          const url = String(value || '').trim()
          return url ? <MeetLinkActions url={url} onCopied={notifyLinkCopied} /> : '—'
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

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <EventAvailableOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Doctor meetings
        </Typography>
        <Button size="small" variant="outlined" onClick={() => void refetch()} disabled={isFetching}>
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

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
        }}
      >
        <TextField
          size="small"
          label="Patient name or phone"
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          fullWidth
        />
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
        <FormControl size="small" fullWidth>
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
        </FormControl>
        <DateFilterField
          size="small"
          label="From date"
          value={appointmentFrom}
          onValueChange={(value) => {
            setAppointmentFrom(value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          fullWidth
        />
        <DateFilterField
          size="small"
          label="To date"
          value={appointmentTo}
          onValueChange={(value) => {
            setAppointmentTo(value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          fullWidth
        />
        <TextField
          size="small"
          label="Booking code"
          value={bookingCode}
          onChange={(e) => {
            setBookingCode(e.target.value)
            setPaginationModel((p) => ({ ...p, page: 0 }))
          }}
          fullWidth
          sx={{ gridColumn: { xs: '1', sm: 'span 2', md: 'span 2' } }}
        />
      </Box>

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
                    size="small"
                    variant="outlined"
                    component="a"
                    href={detailQuery.data.item.appointmentMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewOutlinedIcon />}
                  >
                    Open Google Meet
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
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
            sx={{ mt: 2 }}
            fullWidth
            variant="outlined"
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
