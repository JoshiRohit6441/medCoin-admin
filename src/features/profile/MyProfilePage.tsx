import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { ProfilePageSkeleton } from '../../components/layout/AppSkeletons'
import { useGetMeQuery, useUpdateProfileMutation } from '../../store/api/medcoinAdminApi'
import { useAppToast } from '../../hooks/useAppToast'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setUser } from '../../store/slices/authSlice'
import { getErrorMessage } from '../../utils/errorMessage'
import ProfileAvatarUpload from '../../components/profile/ProfileAvatarUpload'
import { AUTH_NAVY, authFieldSx, authPrimaryButtonSx } from '../../components/auth/authTheme'

export default function MyProfilePage() {
  const dispatch = useAppDispatch()
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const cachedUser = useAppSelector((s) => s.auth.user)
  const { data, isLoading: loadingMe } = useGetMeQuery()
  const user = data?.user ?? cachedUser

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [updateProfile, { isLoading }] = useUpdateProfileMutation()

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const result = await updateProfile({ name, email, phone }).unwrap()
      dispatch(setUser(result.user))
      showSuccess('Profile details saved.')
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  if (loadingMe && !user) {
    return <ProfilePageSkeleton />
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: AUTH_NAVY, mb: 0.5 }}>
        My profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account details and profile photo.
      </Typography>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 24px rgba(15,39,68,0.06)',
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${AUTH_NAVY} 0%, #1a3a5c 100%)`,
            px: { xs: 2, sm: 4 },
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ProfileAvatarUpload
            name={name}
            email={email}
            profilePic={user?.profilePic}
            size={120}
          />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mt: 2 }}>
            {name || 'Admin'}
          </Typography>
          <Chip
            label={(user?.role || 'admin').toUpperCase()}
            size="small"
            sx={{
              mt: 1,
              bgcolor: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.65rem',
            }}
          />
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit} spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: AUTH_NAVY }}>
                Account information
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={authFieldSx}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                <TextField
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="+55 11 99999-9999"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={authFieldSx}
                />
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{ ...authPrimaryButtonSx, minWidth: 160 }}
              >
                {isLoading ? 'Saving…' : 'Save changes'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Card>
      <ToastHost />
    </Box>
  )
}
