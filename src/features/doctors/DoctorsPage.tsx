import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid'
import { useMemo, useRef, useState, useEffect } from 'react'
import ManageColumnsButton from '../../components/dataGrid/ManageColumnsButton'
import { resolveProfilePicUrl } from '../../config/api'
import ListFilterBar from '../../components/forms/ListFilterBar'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useAppToast } from '../../hooks/useAppToast'
import {
  useCreateDoctorMutation,
  useDeleteDoctorMutation,
  useListDoctorsQuery,
  useUpdateDoctorMutation,
  useUploadDoctorAvatarMutation,
} from '../../store/api/medcoinAdminApi'
import type { Doctor } from '../../types/admin'
import { dataGridHeight, dataGridSx, useResponsiveColumnVisibility } from '../../utils/dataGridMobile'
import { getErrorMessage } from '../../utils/errorMessage'
import { optionalEmailError } from '../../utils/emailValidation'
import { pageButtonProps, pageDataGridCellSx, pageDataGridDefaults } from '../../utils/pageButtons'
import { serialColumn, withSerialNumbers } from '../../utils/gridSerial'

const MOBILE_DOCTOR_COLUMN_VISIBILITY = {
  __serial: false,
  email: false,
  qualification: false,
} as const

type FormState = {
  name: string
  phone: string
  email: string
  qualification: string
  status: 'active' | 'inactive'
}

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  qualification: '',
  status: 'active',
}

function formatPhoneDisplay(digits: string) {
  const d = String(digits || '').replace(/\D/g, '')
  return d ? `+${d}` : '—'
}

function doctorInitial(name?: string) {
  const n = String(name || '').trim()
  return n ? n.charAt(0).toUpperCase() : 'D'
}

export default function DoctorsPage() {
  const apiRef = useGridApiRef()
  const isMobile = useIsMobile()
  const { columnVisibilityModel, onColumnVisibilityModelChange } =
    useResponsiveColumnVisibility(MOBILE_DOCTOR_COLUMN_VISIBILITY)
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [existingProfilePic, setExistingProfilePic] = useState<string | undefined>()

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])
  const { searchInput, debouncedSearch, setSearchInput, resetSearch, hasSearchInput } =
    useDebouncedSearch()

  const sort = sortModel[0]
  const { data, isError, error, refetch, isFetching } = useListDoctorsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sort?.field ?? 'name',
    sortOrder: (sort?.sort as 'asc' | 'desc' | undefined) ?? 'asc',
    search: debouncedSearch || undefined,
    q: debouncedSearch || undefined,
  })

  const [createDoctor, createState] = useCreateDoctorMutation()
  const [updateDoctor, updateState] = useUpdateDoctorMutation()
  const [deleteDoctor, deleteState] = useDeleteDoctorMutation()
  const [uploadDoctorAvatar, uploadState] = useUploadDoctorAvatarMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [emailTouched, setEmailTouched] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const rows = useMemo(
    () => withSerialNumbers(data?.items ?? [], paginationModel.page, paginationModel.pageSize),
    [data?.items, paginationModel.page, paginationModel.pageSize]
  )

  const hasActiveFilters = hasSearchInput
  const saving = createState.isLoading || updateState.isLoading || uploadState.isLoading

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }, [debouncedSearch])

  function resetFilters() {
    resetSearch()
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }

  function resetAvatarState() {
    setPendingAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setExistingProfilePic(undefined)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setEmailTouched(false)
    resetAvatarState()
    setDialogOpen(true)
  }

  function handleAvatarPick(file: File) {
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      showError('Image must be 3 MB or smaller.')
      return
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setPendingAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatarIfNeeded(doctorId: string) {
    if (!pendingAvatarFile) return
    await uploadDoctorAvatar({ id: doctorId, file: pendingAvatarFile }).unwrap()
  }

  async function submitForm() {
    if (!form.name.trim() || !form.phone.trim()) {
      showError('Name and phone are required.')
      return
    }
    const emailErr = optionalEmailError(form.email)
    if (emailErr) {
      setEmailTouched(true)
      showError(emailErr)
      return
    }
    const normalizedEmail = form.email.trim().toLowerCase()
    try {
      if (editingId) {
        await updateDoctor({
          id: editingId,
          body: {
            name: form.name.trim(),
            phone: form.phone.replace(/\D/g, ''),
            email: normalizedEmail,
            qualification: form.qualification.trim(),
            status: form.status,
          },
        }).unwrap()
        await uploadAvatarIfNeeded(editingId)
        showSuccess('Doctor updated.')
      } else {
        const created = await createDoctor({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ''),
          email: normalizedEmail,
          qualification: form.qualification.trim(),
          status: form.status,
        }).unwrap()
        await uploadAvatarIfNeeded(created.item._id)
        showSuccess('Doctor added.')
      }
      setDialogOpen(false)
      resetAvatarState()
      void refetch()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteDoctor(deleteId).unwrap()
      setDeleteId(null)
      showSuccess('Doctor removed.')
      void refetch()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const columns: GridColDef<Doctor & { __serial?: number }>[] = useMemo(
    () => [
      serialColumn(),
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              src={resolveProfilePicUrl(params.row.profilePic)}
              sx={{ width: 28, height: 28, fontSize: '0.8rem' }}
            >
              {doctorInitial(params.row.name)}
            </Avatar>
            <Typography variant="body2" noWrap>
              {params.row.name}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'phone',
        headerName: 'Phone',
        minWidth: 140,
        valueFormatter: (v) => formatPhoneDisplay(String(v ?? '')),
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 0.6,
        minWidth: 160,
        valueFormatter: (v) => (v ? String(v) : '—'),
      },
      {
        field: 'qualification',
        headerName: 'Qualification',
        flex: 0.6,
        minWidth: 140,
        valueFormatter: (v) => (v ? String(v) : '—'),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value === 'active' ? 'Active' : 'Inactive'}
            color={value === 'active' ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Action',
        width: 150,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Box sx={{ ...pageDataGridCellSx, gap: 1 }}>
            <Button
              {...pageButtonProps}
              onClick={(e) => {
                e.stopPropagation()
                const row = params.row
                setEditingId(row._id)
                setForm({
                  name: row.name,
                  phone: row.phone,
                  email: row.email ?? '',
                  qualification: row.qualification ?? '',
                  status: row.status,
                })
                setEmailTouched(false)
                setPendingAvatarFile(null)
                if (avatarPreview) URL.revokeObjectURL(avatarPreview)
                setAvatarPreview(null)
                setExistingProfilePic(row.profilePic)
                setDialogOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              {...pageButtonProps}
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteId(params.row._id)
              }}
            >
              Delete
            </Button>
          </Box>
        ),
      },
    ],
    []
  )

  const avatarSrc =
    avatarPreview || resolveProfilePicUrl(existingProfilePic) || undefined

  const emailFieldError = emailTouched ? optionalEmailError(form.email) : ''

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Doctors
        </Typography>
        <Button {...pageButtonProps} onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add doctor
        </Button>
      </Box>

      <Alert severity="info">
        Active doctors receive the same booking alerts as platform numbers in Settings. Duplicate
        phone numbers are notified only once.
      </Alert>

      {isError ? <Alert severity="error">{getErrorMessage(error)}</Alert> : null}

      <ListFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, phone, email, or qualification"
        showDates={false}
        onReset={resetFilters}
        resetDisabled={!hasActiveFilters}
      />

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
          pageSizeOptions={[10, 25, 50]}
          {...pageDataGridDefaults}
          disableRowSelectionOnClick
          sx={dataGridSx}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          resetAvatarState()
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>{editingId ? 'Edit doctor' : 'Add doctor'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Box
              component="button"
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={saving}
              aria-label="Upload doctor photo"
              sx={{
                border: 0,
                p: 0,
                bgcolor: 'transparent',
                cursor: saving ? 'wait' : 'pointer',
                borderRadius: '50%',
              }}
            >
              <Avatar src={avatarSrc} sx={{ width: 88, height: 88, fontSize: '2rem' }}>
                {doctorInitial(form.name)}
              </Avatar>
            </Box>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarPick(file)
                e.target.value = ''
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: -1 }}>
            Click photo to upload · JPG, PNG or WebP · max 3 MB
          </Typography>

          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d]/g, '') }))}
            required
            fullWidth
            size="small"
            placeholder="Country code and mobile number"
            helperText="Digits only — include country code (the + is added automatically)"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      +
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => setEmailTouched(true)}
            error={Boolean(emailFieldError)}
            helperText={emailFieldError || 'Optional — use a valid email address'}
            fullWidth
            size="small"
            autoComplete="email"
          />
          <TextField
            label="Qualification"
            value={form.qualification}
            onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
            fullWidth
            size="small"
            placeholder="e.g. MBBS, Cardiologist"
          />
          <TextField
            select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as FormState['status'] }))
            }
            fullWidth
            size="small"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDialogOpen(false)
              resetAvatarState()
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitForm()} disabled={saving || Boolean(emailFieldError)}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete doctor?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={deleteState.isLoading}
          >
            {deleteState.isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastHost />
    </Stack>
  )
}
