import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom'
import { useLoginMutation } from '../../store/api/medcoinAdminApi'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../utils/errorMessage'
import AuthShell from './AuthShell'
import { AuthEmailField, AuthPasswordField } from './AuthFields'
import { AUTH_NAVY, AUTH_NAVY_LIGHT, authPrimaryButtonSx } from './authTheme'

export default function LoginPage() {
  const token = useAppSelector((s) => s.auth.accessToken)
  const location = useLocation()
  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showSetupHint, setShowSetupHint] = useState(false)
  const [login, { isLoading, error }] = useLoginMutation()

  if (token) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login({ email, password, rememberMe }).unwrap()
    } catch {
      /* surfaced via error */
    }
  }

  return (
    <AuthShell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75, color: AUTH_NAVY }}>
        Bem-vindo de volta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Entre com sua conta de administrador para gerenciar pacientes, consultas e pagamentos.
      </Typography>

      {resetSuccess ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Senha redefinida com sucesso. Faça login com a nova senha.
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(error)}
        </Alert>
      ) : null}

      <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
        <AuthEmailField value={email} onChange={setEmail} />

        <Box>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Senha
            </Typography>
            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              underline="hover"
              sx={{ color: AUTH_NAVY_LIGHT, fontSize: '0.8125rem' }}
            >
              Esqueceu a senha?
            </Link>
          </Stack>
          <AuthPasswordField
            label=""
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            required
          />
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              size="small"
              sx={{
                color: AUTH_NAVY_LIGHT,
                '&.Mui-checked': { color: AUTH_NAVY },
              }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Manter-me conectado neste dispositivo
            </Typography>
          }
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          fullWidth
          size="large"
          sx={authPrimaryButtonSx}
        >
          {isLoading ? 'Entrando…' : 'Entrar'}
        </Button>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          sx={{ color: 'text.secondary', border: 0, background: 'none', cursor: 'pointer' }}
          onClick={() => setShowSetupHint((v) => !v)}
        >
          Primeiro acesso ao painel?
        </Link>
        <Collapse in={showSetupHint}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, lineHeight: 1.5, textAlign: 'left' }}
          >
            Crie o primeiro administrador pelo endpoint{' '}
            <Box component="code" sx={{ fontSize: '0.75rem' }}>
              POST /api/admin/auth/bootstrap
            </Box>{' '}
            no backend (apenas quando ainda não existe nenhum admin).
          </Typography>
        </Collapse>
      </Box>
    </AuthShell>
  )
}
