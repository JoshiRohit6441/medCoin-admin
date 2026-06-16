import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { SIDEBAR_COLOR } from '../auth/authTheme'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../constants/brand'

function NavIconBox({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        bgcolor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: SIDEBAR_COLOR,
        border: '1px solid',
        borderColor: 'rgba(9, 23, 57, 0.08)',
        boxShadow: '0 1px 2px rgba(9, 23, 57, 0.06)',
      }}
    >
      {children}
    </Box>
  )
}

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: DashboardOutlinedIcon },
  { to: '/patients', label: 'Patients', icon: GroupsOutlinedIcon },
  { to: '/consultations', label: 'Consultations', icon: LocalHospitalOutlinedIcon },
  { to: '/meetings', label: 'Doctor meetings', icon: EventAvailableOutlinedIcon },
  { to: '/transactions', label: 'Transactions', icon: PaymentsOutlinedIcon },
  { to: '/severities', label: 'Severity levels', icon: TuneOutlinedIcon },
  { to: '/settings', label: 'Settings', icon: SettingsOutlinedIcon },
] as const

type SidebarNavProps = {
  collapsed: boolean
  loggingOut: boolean
  onLogout: () => void
  onNavigate?: () => void
  showBrand?: boolean
  headerSlot?: ReactNode
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  const logo = (
    <Box
      component="img"
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      sx={{
        height: collapsed ? 34 : 42,
        width: 'auto',
        maxWidth: collapsed ? 48 : 176,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
      }}
    />
  )

  if (collapsed) {
    return (
      <Tooltip title={BRAND_NAME} placement="right">
        {logo}
      </Tooltip>
    )
  }

  return logo
}

export default function SidebarNav({
  collapsed,
  loggingOut,
  onLogout,
  onNavigate,
  showBrand = true,
  headerSlot,
}: SidebarNavProps) {
  const location = useLocation()

  return (
    <>
      {showBrand ? (
        <>
          <Box
            sx={{
              px: collapsed ? 0.75 : 1.5,
              py: 1.25,
              position: 'relative',
              display: 'flex',
              flexDirection: collapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: collapsed ? 0.5 : 0,
              minHeight: collapsed ? 56 : 60,
              flexShrink: 0,
            }}
          >
            <SidebarBrand collapsed={collapsed} />
            {headerSlot}
          </Box>
          <Divider />
        </>
      ) : null}

      <List dense disablePadding sx={{ py: 0.75, flex: 1, px: collapsed ? 0.75 : 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const selected =
            'end' in item && item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

          const button = (
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={'end' in item ? item.end : false}
              selected={selected}
              onClick={onNavigate}
              sx={{
                mx: collapsed ? 0 : 0.5,
                borderRadius: 2,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                minHeight: 44,
                px: collapsed ? 1 : 1.25,
                py: 0.75,
                gap: 1.25,
                color: SIDEBAR_COLOR,
                '&:hover': {
                  bgcolor: 'rgba(9, 23, 57, 0.04)',
                },
                '&.Mui-selected': {
                  bgcolor: SIDEBAR_COLOR,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: SIDEBAR_COLOR,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                <NavIconBox>
                  <Icon sx={{ fontSize: 18 }} />
                </NavIconBox>
              </ListItemIcon>
              {!collapsed ? (
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: selected ? 600 : 500,
                      fontSize: '0.875rem',
                    },
                  }}
                />
              ) : null}
            </ListItemButton>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.to} title={item.label} placement="right" arrow>
                <Box component="span" sx={{ display: 'block' }}>
                  {button}
                </Box>
              </Tooltip>
            )
          }

          return <Box key={item.to}>{button}</Box>
        })}
      </List>

      <Divider sx={{ flexShrink: 0 }} />

      <List dense disablePadding sx={{ py: 1, flexShrink: 0, px: collapsed ? 0.5 : 0 }}>
        {collapsed ? (
          <Tooltip title={loggingOut ? 'Signing out…' : 'Log out'} placement="right" arrow>
            <Box component="span" sx={{ display: 'block' }}>
              <ListItemButton
                disabled={loggingOut}
                onClick={onLogout}
                sx={{
                  mx: 0.5,
                  borderRadius: 1,
                  color: 'error.main',
                  justifyContent: 'center',
                  minHeight: 48,
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: 'error.main', justifyContent: 'center' }}>
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </Box>
          </Tooltip>
        ) : (
          <ListItemButton
            disabled={loggingOut}
            onClick={onLogout}
            sx={{
              mx: 1,
              borderRadius: 1,
              color: 'error.main',
              minHeight: 48,
              '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={loggingOut ? 'Signing out…' : 'Log out'} />
          </ListItemButton>
        )}
      </List>
    </>
  )
}
