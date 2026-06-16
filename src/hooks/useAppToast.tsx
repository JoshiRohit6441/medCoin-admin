import type { AlertColor } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import AppToast from '../components/feedback/AppToast'

export function useAppToast() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('success')

  const close = useCallback(() => setOpen(false), [])

  const show = useCallback((nextMessage: string, nextSeverity: AlertColor = 'success') => {
    setMessage(nextMessage)
    setSeverity(nextSeverity)
    setOpen(true)
  }, [])

  const showSuccess = useCallback((nextMessage: string) => show(nextMessage, 'success'), [show])
  const showError = useCallback((nextMessage: string) => show(nextMessage, 'error'), [show])
  const showInfo = useCallback((nextMessage: string) => show(nextMessage, 'info'), [show])
  const showWarning = useCallback((nextMessage: string) => show(nextMessage, 'warning'), [show])

  const Host = useMemo(
    () =>
      function AppToastHost() {
        return (
          <AppToast open={open} message={message} severity={severity} onClose={close} />
        )
      },
    [close, message, open, severity]
  )

  return { show, showSuccess, showError, showInfo, showWarning, close, Host }
}
