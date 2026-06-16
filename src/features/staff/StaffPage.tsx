import {
  Alert,
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useState } from 'react'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useGetStaffQuery, useListStaffQuery } from '../../store/api/medcoinAdminApi'
import type { StaffMember } from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
import { buildDateRangeParams, formatDateTime } from '../../utils/dateFormat'

const columns: GridColDef<StaffMember>[] = [
  { field: 'name', headerName: 'Name', minWidth: 140, flex: 0.45 },
  { field: 'email', headerName: 'Email', minWidth: 200, flex: 0.55 },
  { field: 'role', headerName: 'Role', width: 100 },
  { field: 'status', headerName: 'Status', width: 100 },
  { field: 'phone', headerName: 'Phone', minWidth: 130 },
  {
    field: 'createdAt',
    headerName: 'Created',
    minWidth: 170,
    flex: 0.4,
    type: 'string',
    renderCell: (params) => formatDateTime(params.value),
  },
]

export default function StaffPage() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ])
  const [quickFilter, setQuickFilter] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListStaffQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'createdAt',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'desc',
    search: quickFilter || undefined,
    q: quickFilter || undefined,
    ...buildDateRangeParams(createdFrom, createdTo),
  })

  const detailQuery = useGetStaffQuery(selectedId ?? '', { skip: !selectedId })
  const hasActiveFilters = Boolean(quickFilter || createdFrom || createdTo)

  function resetFilters() {
    setQuickFilter('')
    setCreatedFrom('')
    setCreatedTo('')
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Staff
        </Typography>
        <Button size="small" variant="outlined" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </Box>
      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <ListFilterBar
        search={quickFilter}
        onSearchChange={(value) => {
          setQuickFilter(value)
          setPaginationModel((p) => ({ ...p, page: 0 }))
        }}
        searchPlaceholder="Search by name, email, or phone"
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
      <Box sx={{ width: '100%', height: 520 }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          getRowId={(r) => r._id as string}
          loading={isLoading}
          rowCount={data?.pagination.total ?? 0}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          onRowClick={(params) => setSelectedId(String(params.id))}
          pageSizeOptions={[10, 25, 50]}
          density="compact"
          disableRowSelectionOnClick
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

      <Drawer anchor="right" open={Boolean(selectedId)} onClose={() => setSelectedId(null)}>
        <Box sx={{ width: 380, p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Staff detail
          </Typography>
          {!selectedId ? null : detailQuery.isLoading ? (
            <Typography variant="body2">Loading…</Typography>
          ) : detailQuery.isError ? (
            <Alert severity="error">{getErrorMessage(detailQuery.error)}</Alert>
          ) : (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Name:</strong> {detailQuery.data?.item.name ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {detailQuery.data?.item.email ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {detailQuery.data?.item.role ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {detailQuery.data?.item.status ?? '—'}
              </Typography>
            </Stack>
          )}
          <Button sx={{ mt: 2 }} onClick={() => setSelectedId(null)} fullWidth variant="outlined">
            Close
          </Button>
        </Box>
      </Drawer>
    </Stack>
  )
}
