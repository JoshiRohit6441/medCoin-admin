import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useRequestPasswordResetOtpMutation,
  useVerifyPasswordResetOtpMutation,
} from '../../store/api/medcoinAdminApi'
import { getErrorMessage } from '../../utils/errorMessage'
import { AuthBackLink } from './AuthBackLink'
import AuthShell from './AuthShell'
import { AuthEmailField } from './AuthFields'
import OtpInput from './OtpInput'
import { AUTH_NAVY, authPrimaryButtonSx } from './authTheme'

const OTP_EXPIRES_MIN = 10

type Step = 'email' | 'verify'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)

  const [requestOtp, { isLoading: requesting, error: requestError }] =
    useRequestPasswordResetOtpMutation()
  const [verifyOtp, { isLoading: verifying, error: verifyError }] =
    useVerifyPasswordResetOtpMutation()

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setDevOtpHint(null)
    setOtp('')
    try {
      const res = await requestOtp({ email }).unwrap()
      if (res.devOtp) setDevOtpHint(res.devOtp)
      setStep('verify')
    } catch {
      /* surfaced */
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault()
    if (otp.length !== 6) return
    try {
      await verifyOtp({ email, otp }).unwrap()
      navigate('/reset-password', { replace: true, state: { fromForgot: true, email } })
    } catch {
      /* surfaced */
    }
  }

  async function handleResendOtp() {
    setDevOtpHint(null)
    setOtp('')
    try {
      const res = await requestOtp({ email }).unwrap()
      if (res.devOtp) setDevOtpHint(res.devOtp)
    } catch {
      /* surfaced */
    }
  }

  function useDifferentEmail() {
    setStep('email')
    setOtp('')
    setDevOtpHint(null)
  }

  if (step === 'email') {
    return (
      <AuthShell>
        <AuthBackLink to="/login" label="Voltar ao login" />

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75, color: AUTH_NAVY }}>
          Redefinir senha
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          Informe o e-mail da conta de administrador. Enviaremos um código de verificação (OTP) para
          confirmar sua identidade.
        </Typography>

        {requestError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {getErrorMessage(requestError)}
          </Alert>
        ) : null}

        <Stack spacing={2.5} component="form" onSubmit={handleRequestOtp}>
          <AuthEmailField
            value={email}
            onChange={setEmail}
            label="E-mail da conta admin"
            placeholder="seu@email.com.br"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={requesting}
            fullWidth
            size="large"
            sx={authPrimaryButtonSx}
          >
            {requesting ? 'Enviando…' : 'Enviar código de verificação'}
          </Button>
        </Stack>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 1, color: AUTH_NAVY, textAlign: 'center' }}
      >
        Verifique sua caixa de entrada
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2.5, lineHeight: 1.6, textAlign: 'center' }}
      >
        Enviamos um código de verificação de 6 dígitos para{' '}
        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {email}
        </Box>
        .
      </Typography>

      <Box
        sx={{
          bgcolor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 2,
          p: 2,
          mb: 2,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <CheckCircleOutlinedIcon sx={{ color: '#059669', mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#047857', mb: 0.5 }}>
            Código enviado
          </Typography>
          <Typography variant="body2" sx={{ color: '#065f46', lineHeight: 1.5 }}>
            Digite o código OTP abaixo para verificar sua conta. O código expira em{' '}
            {OTP_EXPIRES_MIN} minutos.
          </Typography>
        </Box>
      </Box>

      {devOtpHint ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Desenvolvimento — seu código: <strong>{devOtpHint}</strong>
        </Alert>
      ) : null}

      {verifyError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(verifyError)}
        </Alert>
      ) : null}

      <Stack component="form" onSubmit={handleVerifyOtp} spacing={2}>
        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'center' }}>
          Código de verificação (OTP)
        </Typography>

        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={verifying}
          autoFocus
        />

        <Button
          type="submit"
          variant="contained"
          disabled={verifying || otp.length !== 6}
          fullWidth
          size="large"
          sx={authPrimaryButtonSx}
        >
          {verifying ? 'Verificando…' : 'Verificar código'}
        </Button>

        <Button
          type="button"
          variant="outlined"
          fullWidth
          onClick={useDifferentEmail}
          sx={{
            py: 1.25,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e2e8f0',
            color: AUTH_NAVY,
          }}
        >
          Usar outro e-mail
        </Button>

        <Button
          type="button"
          variant="text"
          disabled={requesting}
          onClick={handleResendOtp}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          {requesting ? 'Reenviando código…' : 'Não recebeu? Reenviar código'}
        </Button>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <AuthBackLink to="/login" label="Voltar ao login" />
      </Box>
    </AuthShell>
  )
}
