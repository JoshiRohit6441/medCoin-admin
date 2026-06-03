import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveProfilePicUrl } from '../../config/api'
import { useLogoutMutation } from '../../store/api/medcoinAdminApi'
import { useAppSelector } from '../../store/hooks'

function userInitial(user: { name?: string; email?: string } | null) {
  const name = String(user?.name || '').trim()
  if (name) return name.charAt(0).toUpperCase()
  const email = String(user?.email || '').trim()
  if (email) return email.charAt(0).toUpperCase()
  return 'A'
}

function roleLabel(role?: string) {
  const r = String(role || 'admin').trim()
  return r ? r.replace(/_/g, ' ').toUpperCase() : 'ADMIN'
}

export default function AdminUserMenu() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Admin'

  function go(path: string) {
    setAnchor(null)
    navigate(path)
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        aria-label="Account menu"
        sx={{ p: 0.25 }}
      >
        <Avatar
          src={resolveProfilePicUrl(user?.profilePic)}
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#ea580c',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          {userInitial(user)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(15,39,68,0.12)',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {displayName}
          </Typography>
          <Chip
            label={roleLabel(user?.role)}
            size="small"
            sx={{
              mt: 1,
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: '#f1f5f9',
              color: 'primary.main',
            }}
          />
          {user?.email ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}
            >
              {user.email}
            </Typography>
          ) : null}
        </Box>

        <Divider />

        <MenuItem onClick={() => go('/profile')} sx={{ py: 1.25, color: 'primary.main' }}>
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}>
            <PersonOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          My profile
        </MenuItem>

        <MenuItem onClick={() => go('/change-password')} sx={{ py: 1.25, color: 'primary.main' }}>
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}>
            <LockOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Change password
        </MenuItem>

        <Divider />

        <MenuItem
          disabled={loggingOut}
          onClick={() => {
            setAnchor(null)
            void logout()
          }}
          sx={{ py: 1.25, color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {loggingOut ? 'Signing out…' : 'Log out'}
        </MenuItem>
      </Menu>
    </>
  )
}
