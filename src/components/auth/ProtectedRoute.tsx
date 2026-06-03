import { Box, LinearProgress } from '@mui/material'
import { Navigate, Outlet } from 'react-router-dom'
import { useGetMeQuery } from '../../store/api/medcoinAdminApi'
import { useAppSelector } from '../../store/hooks'

export default function ProtectedRoute() {
  const token = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (token && !user && isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  if (token && !user && isError) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
