import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, Outlet, NavLink } from 'react-router-dom'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../constants/brand'
import { useLogoutMutation } from '../../store/api/medcoinAdminApi'
import AdminUserMenu from './AdminUserMenu'

const DRAWER_EXPANDED = 240
const DRAWER_COLLAPSED = 72
const SIDEBAR_STORAGE_KEY = 'medcoin_admin_sidebar_collapsed'

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

const nav = [
  { to: '/', label: 'Dashboard', end: true, icon: DashboardOutlinedIcon },
  { to: '/patients', label: 'Patients', icon: GroupsOutlinedIcon },
  { to: '/consultations', label: 'Consultations', icon: LocalHospitalOutlinedIcon },
  { to: '/meetings', label: 'Doctor meetings', icon: EventAvailableOutlinedIcon },
  { to: '/transactions', label: 'Transactions', icon: PaymentsOutlinedIcon },
  { to: '/severities', label: 'Severity levels', icon: TuneOutlinedIcon },
  { to: '/settings', label: 'Settings', icon: SettingsOutlinedIcon },
] as const

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function AdminLayout() {
  const location = useLocation()
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)

  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const widthTransition = (theme: {
    transitions: {
      create: (property: string, options: object) => string
      easing: { sharp: string }
      duration: { enteringScreen: number }
    }
  }) =>
    theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    })

  const drawerSx = {
    width: drawerWidth,
    flexShrink: 0,
    transition: widthTransition,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      height: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      borderRight: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      transition: widthTransition,
    },
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'grey.50' }}>
      <Drawer variant="permanent" sx={drawerSx}>
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
          <IconButton
            size="small"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            sx={{
              color: 'text.secondary',
              ...(collapsed
                ? {}
                : {
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }),
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Divider />

        {!collapsed ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
              MENU
            </Typography>
          </Box>
        ) : null}

        <List dense disablePadding sx={{ py: 0.5, flex: 1, px: collapsed ? 0.5 : 0 }}>
          {nav.map((item) => {
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
                sx={{
                  mx: collapsed ? 0.5 : 1,
                  borderRadius: 1,
                  mb: 0.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  minHeight: 44,
                  px: collapsed ? 1 : 2,
                  '&.Mui-selected': {
                    bgcolor: 'grey.100',
                    '&:hover': { bgcolor: 'grey.200' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    color: selected ? 'primary.main' : 'text.secondary',
                    justifyContent: 'center',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed ? <ListItemText primary={item.label} /> : null}
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
                  onClick={() => void logout()}
                  sx={{
                    mx: 0.5,
                    borderRadius: 1,
                    color: 'error.main',
                    justifyContent: 'center',
                    minHeight: 44,
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
              onClick={() => void logout()}
              sx={{
                mx: 1,
                borderRadius: 1,
                color: 'error.main',
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
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            flexShrink: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 56, justifyContent: 'flex-end', px: { xs: 2, sm: 2.5 } }}>
            <AdminUserMenu />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 2, sm: 2.5 },
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
