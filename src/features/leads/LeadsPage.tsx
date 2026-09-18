import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import type { ChipProps } from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ManageColumnsButton from '../../components/dataGrid/ManageColumnsButton'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { ADMIN_API_BASE } from '../../config/api'
import { useGetLeadsSummaryQuery, useListLeadsQuery } from '../../store/api/medcoinAdminApi'
import { readStoredAccessToken } from '../../store/slices/authSlice'
import type { Consultation } from '../../types/admin'
import { dataGridHeight, dataGridSx, useResponsiveColumnVisibility } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import {
  LEAD_SEGMENTS,
  type LeadSegmentId,
  leadSegmentForSession,
  leadSegmentLabel,
} from '../../utils/leadSegments'
import { consultationStateLabel } from '../../utils/consultationState'
import { formatPatientAge } from '../../utils/patientDisplay'
import {
  pageButtonProps,
  pageDataGridCellSx,
  pageDataGridDefaults,
  pageStatusChipSx,
} from '../../utils/pageButtons'
import { formatDateTime, serialColumn, withSerialNumbers } from '../../utils/gridSerial'

function patientField(row: Consultation, key: 'phone' | 'name'): string {
  const p = row.patient
  if (p && typeof p === 'object') {
    const v = p[key]
    return v != null ? String(v) : ''
  }
  return ''
}

function segmentChipColor(segment: string): ChipProps['color'] {
  if (segment === 'triage_started') return 'info'
  if (segment === 'triage_unpaid') return 'warning'
  if (segment === 'paid') return 'success'
  if (segment === 'consultation_completed') return 'primary'
  if (segment === 'inactive') return 'default'
  return 'default'
}

function resolveSegment(row: Consultation): string {
  return leadSegmentForSession(row) || ''
}

const MOBILE_LEAD_COLUMN_VISIBILITY = {
  __serial: false,
  patientAge: false,
  state: false,
  lastActivityAt: false,
} as const

export default function LeadsPage() {
  const apiRef = useGridApiRef()
  const isMobile = useIsMobile()
  const { columnVisibilityModel, onColumnVisibilityModelChange } =
    useResponsiveColumnVisibility(MOBILE_LEAD_COLUMN_VISIBILITY)
  const [searchParams, setSearchParams] = useSearchParams()
  const segmentParam = searchParams.get('segment') || ''
  const activeSegment = LEAD_SEGMENTS.some((s) => s.id === segmentParam)
    ? (segmentParam as LeadSegmentId)
    : ''

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ])
  const {
    searchInput,
    debouncedSearch,
    setSearchInput,
    resetSearch,
    hasSearchInput,
  } = useDebouncedSearch()

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const sort = sortModel[0]
  const { data: summary } = useGetLeadsSummaryQuery()
  const { data, isError, error, refetch, isFetching } = useListLeadsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'updatedAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    segment: activeSegment || undefined,
    search: debouncedSearch || undefined,
    q: debouncedSearch || undefined,
  })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize],
  )

  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }))
  }, [debouncedSearch, activeSegment])

  function applySegment(next: LeadSegmentId | '') {
    const params = new URLSearchParams(searchParams)
    if (!next) params.delete('segment')
    else params.set('segment', next)
    setSearchParams(params, { replace: true })
  }

  async function exportCsv() {
    setExportError('')
    setExporting(true)
    try {
      const qs = new URLSearchParams()
      if (activeSegment) qs.set('segment', activeSegment)
      if (debouncedSearch) {
        qs.set('search', debouncedSearch)
        qs.set('q', debouncedSearch)
      }
      const sortField = sortModel[0]?.field
      const sortOrder = sortModel[0]?.sort
      if (sortField) qs.set('sortBy', sortField)
      if (sortOrder) qs.set('sortOrder', sortOrder)

      const token = readStoredAccessToken()
      const res = await fetch(`${ADMIN_API_BASE}/leads/export?${qs.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `leads-${activeSegment || 'all'}-${stamp}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(getErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const columns: GridColDef<Consultation & { __serial: number }>[] = useMemo(
    () => [
      serialColumn(),
      {
        field: 'leadSegment',
        headerName: 'Segment',
        minWidth: 210,
        flex: 0.45,
        sortable: false,
        valueGetter: (_v, row) => resolveSegment(row),
        renderCell: ({ row }) => {
          const segment = resolveSegment(row)
          return (
            <Box sx={pageDataGridCellSx}>
              <Chip
                size="small"
                label={leadSegmentLabel(segment)}
                color={segmentChipColor(segment)}
                variant="outlined"
                sx={pageStatusChipSx}
              />
            </Box>
          )
        },
      },
      {
        field: 'patientName',
        headerName: 'Patient',
        minWidth: 140,
        flex: 0.4,
        sortable: false,
        valueGetter: (_v, row) => patientField(row, 'name') || row.calendlyInviteeName || '—',
      },
      {
        field: 'patientPhone',
        headerName: 'Phone',
        minWidth: 140,
        sortable: false,
        valueGetter: (_v, row) => patientField(row, 'phone') || '—',
      },
      {
        field: 'patientAge',
        headerName: 'Age',
        width: 64,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_v, row) => {
          const p = row.patient
          if (p && typeof p === 'object' && 'age' in p) {
            return formatPatientAge((p as { age?: number }).age)
          }
          return '—'
        },
      },
      {
        field: 'state',
        headerName: 'Session',
        minWidth: 140,
        sortable: false,
        valueGetter: (_v, row) => consultationStateLabel(row.state),
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 96,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated',
        minWidth: 168,
        flex: 0.35,
        type: 'string',
        renderCell: (params) => formatDateTime(params.value),
      },
      {
        field: 'lastActivityAt',
        headerName: 'Last activity',
        minWidth: 168,
        type: 'string',
        renderCell: (params) => formatDateTime(params.value),
      },
    ],
    [],
  )

  const hasActiveFilters = Boolean(hasSearchInput || activeSegment)

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <CampaignOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Leads
        </Typography>
        <Button {...pageButtonProps} onClick={() => void refetch()} disabled={isFetching}>
          Refresh
        </Button>
        <Button
          {...pageButtonProps}
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={() => void exportCsv()}
          disabled={exporting || isFetching}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          label={`All: ${summary?.total ?? '—'}`}
          variant={!activeSegment ? 'filled' : 'outlined'}
          onClick={() => applySegment('')}
          sx={{ cursor: 'pointer' }}
        />
        {LEAD_SEGMENTS.map((segment) => (
          <Chip
            key={segment.id}
            label={`${segment.label}: ${summary?.counts?.[segment.id] ?? '—'}`}
            color={segmentChipColor(segment.id)}
            variant={activeSegment === segment.id ? 'filled' : 'outlined'}
            onClick={() => applySegment(segment.id)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>

      <ListFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchLabel="Patient name or phone"
        searchPlaceholder="Name or phone number"
        showDates={false}
        onReset={() => {
          resetSearch()
          applySegment('')
        }}
        resetDisabled={!hasActiveFilters}
      />

      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      {exportError ? <Alert severity="error">{exportError}</Alert> : null}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <ManageColumnsButton apiRef={apiRef} />
      </Box>
      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          getRowId={(r) =>
            r.patient && typeof r.patient === 'object' && r.patient._id
              ? String(r.patient._id)
              : r._id
          }
          loading={isFetching}
          rowCount={data?.pagination.total ?? 0}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50]}
          {...pageDataGridDefaults}
          disableRowSelectionOnClick
          sx={dataGridSx}
        />
      </Box>
    </Stack>
  )
}
