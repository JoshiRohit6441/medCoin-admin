import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useChangePasswordMutation } from '../../store/api/medcoinAdminApi'
import { getErrorMessage } from '../../utils/errorMessage'
import { AuthPasswordField } from '../../components/auth/AuthFields'
import { AUTH_NAVY, authPrimaryButtonSx } from '../../components/auth/authTheme'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changePassword, { isLoading, error }] = useChangePasswordMutation()
  const [passwordOk, setPasswordOk] = useState(false)
  const [clientError, setClientError] = useState('')

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordOk(false)
    setClientError('')
    if (newPassword.length < 8) {
      setClientError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setClientError('Passwords do not match.')
      return
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordOk(true)
    } catch {
      /* surfaced */
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: AUTH_NAVY }}>
        Change password
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Update your admin account password. You must enter your current password.
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(error)}</Alert> : null}
          {clientError ? <Alert severity="error" sx={{ mb: 2 }}>{clientError}</Alert> : null}
          {passwordOk ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password updated successfully.
            </Alert>
          ) : null}

          <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
            <AuthPasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              showPassword={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
            />
            <AuthPasswordField
              label="New password"
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v)
                setPasswordOk(false)
              }}
              showPassword={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              helperText="Minimum 8 characters."
            />
            <AuthPasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v)
                setPasswordOk(false)
              }}
              showPassword={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
              helperText={mismatch ? 'Passwords do not match.' : undefined}
            />
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || mismatch}
                sx={authPrimaryButtonSx}
              >
                {isLoading ? 'Saving…' : 'Update password'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
