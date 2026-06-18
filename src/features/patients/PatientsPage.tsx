import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid'
import { useMemo, useState, useEffect } from 'react'
import ManageColumnsButton from '../../components/dataGrid/ManageColumnsButton'
import DetailDrawer from '../../components/layout/DetailDrawer'
import { DetailDrawerSkeleton } from '../../components/layout/AppSkeletons'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useGetPatientQuery, useListPatientsQuery } from '../../store/api/medcoinAdminApi'
import type { Patient } from '../../types/admin'
import { dataGridHeight, dataGridSx, useResponsiveColumnVisibility } from '../../utils/dataGridMobile'
import { pageDataGridDefaults } from '../../utils/pageButtons'
import { buildDateRangeParams } from '../../utils/dateFormat'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatPatientAge, formatPatientAgeWithUnit } from '../../utils/patientDisplay'
import { formatDateTime, serialColumn, withSerialNumbers, dateTimeColumn } from '../../utils/gridSerial'

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

const MOBILE_PATIENT_COLUMN_VISIBILITY = {
  __serial: false,
  age: false,
  createdAt: false,
} as const

export default function PatientsPage() {
  const apiRef = useGridApiRef()
  const isMobile = useIsMobile()
  const { columnVisibilityModel, onColumnVisibilityModelChange } =
    useResponsiveColumnVisibility(MOBILE_PATIENT_COLUMN_VISIBILITY)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: isMobile ? 10 : 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ])
  const { searchInput, debouncedSearch, setSearchInput, resetSearch, hasSearchInput } =
    useDebouncedSearch()
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<number | null>(null)

  const sort = sortModel[0]
  const { data, isError, error, refetch, isFetching } = useListPatientsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'createdAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    search: debouncedSearch || undefined,
    q: debouncedSearch || undefined,
    ...buildDateRangeParams(createdFrom, createdTo),
  })

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const detailQuery = useGetPatientQuery(selectedId ?? '', { skip: !selectedId })
  const hasActiveFilters = Boolean(hasSearchInput || createdFrom || createdTo)

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }, [debouncedSearch])

  function resetFilters() {
    resetSearch()
    setCreatedFrom('')
    setCreatedTo('')
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }

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

      <ListFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or phone number"
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
      />

      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
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
        title="Patient detail"
      >
          {!selectedId ? null : detailQuery.isLoading ? (
            <DetailDrawerSkeleton rows={5} />
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
