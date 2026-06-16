import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useAppToast } from '../../hooks/useAppToast'
import ListFilterBar from '../../components/forms/ListFilterBar'
import {
  useCreateSeverityMutation,
  useDeleteSeverityMutation,
  useListSeveritiesQuery,
  useUpdateSeverityMutation,
} from '../../store/api/medcoinAdminApi'
import type { SeverityLevel } from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
import { buildDateRangeParams } from '../../utils/dateFormat'
import { dataGridHeight, dataGridSx } from '../../utils/dataGridMobile'
import { pageButtonProps, pageDataGridCellSx, pageDataGridDefaults } from '../../utils/pageButtons'
import { serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const AI_KEYS = ['Low', 'Medium', 'High'] as const

type FormState = {
  name: string
  aiSeverityKey: (typeof AI_KEYS)[number]
  consultancySuggestion: string
  description: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: '',
  aiSeverityKey: 'Low',
  consultancySuggestion: '',
  description: '',
  isActive: true,
}

export default function SeveritiesPage() {
  const isMobile = useIsMobile()
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'aiSeverityKey', sort: 'asc' },
  ])
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListSeveritiesQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'aiSeverityKey',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'asc',
    ...buildDateRangeParams(createdFrom, createdTo),
  })

  const [createSeverity, createState] = useCreateSeverityMutation()
  const [updateSeverity, updateState] = useUpdateSeverityMutation()
  const [deleteSeverity, deleteState] = useDeleteSeverityMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const usedAiKeys = useMemo(
    () => new Set((data?.items ?? []).map((row) => row.aiSeverityKey)),
    [data?.items]
  )

  const availableAiKeysForCreate = useMemo(
    () => AI_KEYS.filter((key) => !usedAiKeys.has(key)),
    [usedAiKeys]
  )

  const hasActiveFilters = Boolean(createdFrom || createdTo)

  function resetFilters() {
    setCreatedFrom('')
    setCreatedTo('')
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }

  const columns: GridColDef<SeverityLevel>[] = useMemo(
    () => [
      serialColumn(),
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'aiSeverityKey', headerName: 'AI key', width: 120 },
      { field: 'isActive', headerName: 'Active', width: 90, type: 'boolean' },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 180,
        cellClassName: 'severity-description-cell',
        renderCell: ({ value }) => {
          const text = value ? String(value) : '—'
          return (
            <Tooltip title={text} placement="top-start" enterDelay={400}>
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                {text}
              </Typography>
            </Tooltip>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Action',
        width: 96,
        minWidth: 96,
        maxWidth: 96,
        flex: 0,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Box sx={{ ...pageDataGridCellSx, justifyContent: 'flex-end' }}>
            <Button
              {...pageButtonProps}
              onClick={(e) => {
                e.stopPropagation()
                const row = params.row
                setEditingId(row._id)
                setForm({
                  name: row.name,
                  aiSeverityKey: row.aiSeverityKey,
                  consultancySuggestion: row.consultancySuggestion,
                  description: row.description ?? '',
                  isActive: row.isActive,
                })
                setDialogOpen(true)
              }}
            >
              Edit
            </Button>
          </Box>
        ),
      },
    ],
    [],
  )

  async function submitForm() {
    if (!form.name.trim() || !form.consultancySuggestion.trim()) return
    try {
      if (editingId) {
        await updateSeverity({
          id: editingId,
          body: {
            name: form.name.trim(),
            consultancySuggestion: form.consultancySuggestion.trim(),
            description: form.description.trim(),
            isActive: form.isActive,
          },
        }).unwrap()
        showSuccess('Severity level updated successfully.')
      } else {
        if (!availableAiKeysForCreate.includes(form.aiSeverityKey)) return
        await createSeverity({
          name: form.name.trim(),
          aiSeverityKey: form.aiSeverityKey,
          consultancySuggestion: form.consultancySuggestion.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        }).unwrap()
        showSuccess('Severity level created successfully.')
      }
      setDialogOpen(false)
      void refetch()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteSeverity(deleteId).unwrap()
      setDeleteId(null)
    } catch {
      /* surfaced */
    }
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Severity levels
        </Typography>
        <Button
          {...pageButtonProps}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refresh
        </Button>
        {/* <Button
          size="small"
          variant="contained"
          onClick={openCreate}
          disabled={!availableAiKeysForCreate.length}
        >
          Add level
        </Button> */}
      </Box>
      {!availableAiKeysForCreate.length && (data?.items?.length ?? 0) >= AI_KEYS.length ? (
        <Alert severity="info">
          Low, Medium, and High levels already exist. Edit an existing row instead of adding a
          duplicate AI key.
        </Alert>
      ) : null}
      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <ListFilterBar
        showSearch={false}
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
      <Box sx={{ width: '100%', height: dataGridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={isMobile ? { __serial: false, description: false } : undefined}
          getRowId={(r) => r._id}
          loading={isLoading}
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
          sx={{
            ...dataGridSx,
            '& .severity-description-cell': {
              overflow: 'hidden',
            },
          }}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>{editingId ? 'Edit severity' : 'New severity'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            fullWidth
            size="small"
          />
          <TextField
            select
            label="AI severity key"
            value={form.aiSeverityKey}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                aiSeverityKey: e.target.value as FormState['aiSeverityKey'],
              }))
            }
            fullWidth
            size="small"
            disabled={Boolean(editingId)}
            helperText={
              editingId
                ? 'AI key cannot be changed after creation (one level per Low/Medium/High).'
                : 'Choose an unused AI severity key.'
            }
          >
            {(editingId ? AI_KEYS : availableAiKeysForCreate).map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Consultancy suggestion"
            value={form.consultancySuggestion}
            onChange={(e) =>
              setForm((f) => ({ ...f, consultancySuggestion: e.target.value }))
            }
            required
            fullWidth
            multiline
            minRows={3}
            size="small"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(_, v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void submitForm()}
            disabled={createState.isLoading || updateState.isLoading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete severity?</DialogTitle>
        <DialogContent>
          {deleteState.error ? (
            <Alert severity="error">{getErrorMessage(deleteState.error)}</Alert>
          ) : (
            <Typography variant="body2">This cannot be undone.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()} disabled={deleteState.isLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ToastHost />
    </Stack>
  )
}
