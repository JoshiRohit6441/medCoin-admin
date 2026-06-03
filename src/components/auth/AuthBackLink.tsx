import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { Link, Typography } from '@mui/material'
import { AUTH_NAVY_LIGHT } from './authTheme'

type AuthBackLinkProps = {
  to: string
  label?: string
}

export function AuthBackLink({ to, label = 'Voltar' }: AuthBackLinkProps) {
  return (
    <Link
      component={RouterLink}
      to={to}
      underline="none"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        color: AUTH_NAVY_LIGHT,
        mb: 2.5,
        '&:hover': { opacity: 0.85 },
      }}
    >
      <ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Link>
  )
}
