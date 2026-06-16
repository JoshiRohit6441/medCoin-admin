import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import DetailDrawer from '../../components/layout/DetailDrawer'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useGetPatientQuery, useListPatientsQuery } from '../../store/api/medcoinAdminApi'
import type { Patient } from '../../types/admin'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatPatientAge, formatPatientAgeWithUnit } from '../../utils/patientDisplay'
import { formatDateTime, serialColumn, withSerialNumbers, dateTimeColumn } from '../../utils/gridSerial'

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ gap: 1, px: 1, py: 1 }}>
      <GridToolbarQuickFilter
        debounceMs={400}
        slotProps={{
          root: {
            placeholder: 'Search by name or phone number',
          },
        }}
      />
    </GridToolbarContainer>
  )
}

const columns: GridColDef<Patient & { __serial?: number }>[] = [
  serialColumn(),
  { field: 'phone', headerName: 'Phone', minWidth: 140, flex: 0.4 },
  {
    field: 'name',
    headerName: 'Name',
    minWidth: 160,
    flex: 0.5,
    valueFormatter: (v) => (v ? String(v) : '—'),
  },
  {
    field: 'age',
    headerName: 'Age',
    width: 72,
    align: 'center',
    headerAlign: 'center',
    type: 'string',
    renderCell: (params) => formatPatientAge(params.value),
  },
  dateTimeColumn('createdAt', 'Created'),
]

export default function PatientsPage() {
  const isMobile = useIsMobile()
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ])
  const [quickFilter, setQuickFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListPatientsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'createdAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    search: quickFilter || undefined,
    q: quickFilter || undefined,
  })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const detailQuery = useGetPatientQuery(selectedId ?? '', { skip: !selectedId })

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Patients
        </Typography>
        <Button size="small" variant="outlined" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>
      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={
            isMobile
              ? { __serial: false, age: false, createdAt: false }
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
          filterDebounceMs={400}
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
          slotProps={{
            loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
          }}
          sx={dataGridSx}
        />
      </Box>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null)
          setSelectedSerial(null)
        }}
        title="Patient detail"
      >
          {!selectedId ? null : detailQuery.isLoading ? (
            <Typography variant="body2">Loading…</Typography>
          ) : detailQuery.isError ? (
            <Alert severity="error">{getErrorMessage(detailQuery.error)}</Alert>
          ) : (
            <Stack spacing={1}>
              {selectedSerial != null ? (
                <Typography variant="body2">
                  <strong>#</strong> {selectedSerial}
                </Typography>
              ) : null}
              <Typography variant="body2">
                <strong>Phone:</strong> {detailQuery.data?.item.phone}
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {detailQuery.data?.item.name || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Age:</strong> {formatPatientAgeWithUnit(detailQuery.data?.item.age)}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {formatDateTime(detailQuery.data?.item.createdAt)}
              </Typography>
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
