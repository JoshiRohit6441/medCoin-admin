import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import { AuthFormSkeleton } from '../layout/AppSkeletons'
import { useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  useGetResetPasswordStatusQuery,
  useResetPasswordMutation,
} from '../../store/api/medcoinAdminApi'
import { getErrorMessage } from '../../utils/errorMessage'
import { AuthBackLink } from './AuthBackLink'
import AuthShell from './AuthShell'
import { AuthPasswordField } from './AuthFields'
import { AUTH_NAVY, authPrimaryButtonSx } from './authTheme'

const MIN_PASSWORD = 8

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromForgot = Boolean((location.state as { fromForgot?: boolean } | null)?.fromForgot)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [clientError, setClientError] = useState('')

  const { data: resetStatus, isLoading: statusLoading } = useGetResetPasswordStatusQuery()
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation()

  const ready = resetStatus?.ready === true
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setClientError('')
    if (newPassword.length < MIN_PASSWORD) {
      setClientError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setClientError('As senhas não coincidem.')
      return
    }
    try {
      await resetPassword({ newPassword }).unwrap()
      navigate('/login', { replace: true, state: { resetSuccess: true } })
    } catch {
      /* surfaced */
    }
  }

  if (statusLoading) {
    return (
      <AuthShell>
        <AuthFormSkeleton />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthBackLink to={fromForgot ? '/forgot-password' : '/login'} label="Voltar" />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75, color: AUTH_NAVY }}>
        Nova senha
      </Typography>

      {!ready ? (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Verifique o código OTP primeiro em{' '}
            <Link component={RouterLink} to="/forgot-password" underline="hover">
              Esqueci minha senha
            </Link>
            . A redefinição só funciona no mesmo navegador após a verificação do código.
          </Alert>
          <Button component={RouterLink} to="/forgot-password" variant="outlined" fullWidth>
            Solicitar redefinição
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            Conta verificada por OTP. Defina uma nova senha para sua conta de administrador
            {resetStatus?.expiresInMinutes
              ? ` (sessão válida por ${resetStatus.expiresInMinutes} minutos).`
              : '.'}
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(error)}
            </Alert>
          ) : null}
          {clientError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {clientError}
            </Alert>
          ) : null}

          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <AuthPasswordField
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              showPassword={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              helperText="Use pelo menos 8 caracteres."
            />

            <AuthPasswordField
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
              placeholder="Repita a senha"
              helperText={mismatch ? 'As senhas não coincidem.' : undefined}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || mismatch}
              fullWidth
              size="large"
              sx={authPrimaryButtonSx}
            >
              {isLoading ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </Stack>
        </>
      )}
    </AuthShell>
  )
}
