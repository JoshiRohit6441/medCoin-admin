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
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import {
  useCreateSeverityMutation,
  useDeleteSeverityMutation,
  useListSeveritiesQuery,
  useUpdateSeverityMutation,
} from '../../store/api/medcoinAdminApi'
import type { SeverityLevel } from '../../types/admin'
import { getErrorMessage } from '../../utils/errorMessage'
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
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'aiSeverityKey', sort: 'asc' },
  ])

  const sort = sortModel[0]
  const { data, isLoading, isError, error, refetch, isFetching } = useListSeveritiesQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'aiSeverityKey',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'asc',
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
        minWidth: 200,
        valueFormatter: (v) => {
          const s = v ? String(v) : ''
          return s.length > 80 ? `${s.slice(0, 80)}…` : s
        },
      },
      {
        field: 'actions',
        headerName: '',
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
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
            <Button
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteId(params.row._id)
              }}
            >
              Delete
            </Button>
          </Stack>
        ),
      },
    ],
    [],
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  async function submitForm() {
    try {
      if (editingId) {
        await updateSeverity({
          id: editingId,
          body: {
            name: form.name,
            aiSeverityKey: form.aiSeverityKey,
            consultancySuggestion: form.consultancySuggestion,
            description: form.description,
            isActive: form.isActive,
          },
        }).unwrap()
      } else {
        await createSeverity({
          name: form.name,
          aiSeverityKey: form.aiSeverityKey,
          consultancySuggestion: form.consultancySuggestion,
          description: form.description,
          isActive: form.isActive,
        }).unwrap()
      }
      setDialogOpen(false)
    } catch {
      /* error surfaced */
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
          size="small"
          variant="outlined"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refresh
        </Button>
        <Button size="small" variant="contained" onClick={openCreate}>
          Add level
        </Button>
      </Box>
      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}
      <Box sx={{ width: '100%', height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
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
          density="compact"
          disableRowSelectionOnClick
          sx={{ border: '1px solid', borderColor: 'divider' }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit severity' : 'New severity'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {(createState.error || updateState.error) && (
            <Alert severity="error">
              {getErrorMessage(createState.error ?? updateState.error)}
            </Alert>
          )}
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
          >
            {AI_KEYS.map((k) => (
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
    </Stack>
  )
}
