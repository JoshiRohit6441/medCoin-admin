import { Alert, Snackbar, type AlertColor } from '@mui/material'

export type AppToastProps = {
  open: boolean
  message: string
  severity?: AlertColor
  onClose: () => void
  autoHideDuration?: number
}

export default function AppToast({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 4000,
}: AppToastProps) {
  if (!message) return null

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
