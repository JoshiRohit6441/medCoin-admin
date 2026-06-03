import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((s) => s.auth.accessToken)
  if (token) {
    return <Navigate to="/" replace />
  }
  return children
}
