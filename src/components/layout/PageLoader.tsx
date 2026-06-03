import { Box, CircularProgress } from '@mui/material'

export default function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
      <CircularProgress size={32} />
    </Box>
  )
}
