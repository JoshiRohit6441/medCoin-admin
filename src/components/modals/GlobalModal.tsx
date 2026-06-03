import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { closeModal } from '../../store/slices/uiSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export default function GlobalModal() {
  const dispatch = useAppDispatch()
  const { open, title, message } = useAppSelector((s) => s.ui.modal)

  return (
    <Dialog
      open={open}
      onClose={() => dispatch(closeModal())}
      maxWidth="sm"
      fullWidth
      aria-labelledby="admin-modal-title"
    >
      <DialogTitle id="admin-modal-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="span">{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => dispatch(closeModal())} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
