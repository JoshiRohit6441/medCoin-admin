export const AUTH_NAVY = '#0f2744'
export const AUTH_NAVY_LIGHT = '#1a3a5c'

export const authFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    bgcolor: '#f8fafc',
  },
} as const

export const authPrimaryButtonSx = {
  py: 1.25,
  borderRadius: 1.5,
  bgcolor: AUTH_NAVY,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: 'none',
  '&:hover': { bgcolor: AUTH_NAVY_LIGHT, boxShadow: 'none' },
}
