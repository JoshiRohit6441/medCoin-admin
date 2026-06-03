import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { authFieldSx } from './authTheme'

type AuthEmailFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
}

export function AuthEmailField({
  value,
  onChange,
  label = 'E-mail',
  placeholder = 'admin@suaclinica.com.br',
  autoComplete = 'email',
  required = true,
}: AuthEmailFieldProps) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75, color: 'text.primary' }}>
        {label}
      </Typography>
      <TextField
        type="email"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        fullWidth
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={authFieldSx}
      />
    </Box>
  )
}

type AuthPasswordFieldProps = {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  autoComplete?: string
  showPassword: boolean
  onToggleShow: () => void
  required?: boolean
  helperText?: string
}

export function AuthPasswordField({
  value,
  onChange,
  label,
  placeholder = 'Digite sua senha',
  autoComplete = 'current-password',
  showPassword,
  onToggleShow,
  required = true,
  helperText,
}: AuthPasswordFieldProps) {
  return (
    <Box>
      {label ? (
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75, color: 'text.primary' }}>
          {label}
        </Typography>
      ) : null}
      <TextField
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        fullWidth
        size="small"
        helperText={helperText}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={onToggleShow}
                  edge="end"
                  size="small"
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={authFieldSx}
      />
    </Box>
  )
}
