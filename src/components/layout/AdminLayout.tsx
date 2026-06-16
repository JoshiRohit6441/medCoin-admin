import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useLogoutMutation } from '../../store/api/medcoinAdminApi'
import { SIDEBAR_COLOR } from '../auth/authTheme'
import AdminUserMenu from './AdminUserMenu'
import SidebarNav, { NAV_ITEMS } from './SidebarNav'

const DRAWER_EXPANDED = 240
const DRAWER_COLLAPSED = 72
const SIDEBAR_STORAGE_KEY = 'medcoin_admin_sidebar_collapsed'

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function pageTitleFromPath(pathname: string): string {
  const item = NAV_ITEMS.find((nav) =>
    'end' in nav && nav.end
      ? pathname === nav.to
      : pathname === nav.to || pathname.startsWith(`${nav.to}/`)
  )
  if (item) return item.label
  if (pathname.startsWith('/profile')) return 'My profile'
  if (pathname.startsWith('/change-password')) return 'Change password'
  return 'MEDCOIN.AI'
}

export default function AdminLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const drawerWidth = isMobile ? DRAWER_EXPANDED : collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED
  const pageTitle = useMemo(() => pageTitleFromPath(location.pathname), [location.pathname])

  useEffect(() => {
    if (!isMobile) return
    setMobileNavOpen(false)
  }, [location.pathname, isMobile])

  useEffect(() => {
    if (isMobile) return
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed, isMobile])

  const widthTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  })

  const drawerPaperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    height: '100dvh',
    overflowX: 'hidden',
    overflowY: 'auto',
    borderRight: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    display: 'flex',
    flexDirection: 'column',
    transition: widthTransition,
    pb: 'env(safe-area-inset-bottom, 0px)',
  }

  const collapseButton = (
    <IconButton
      size="small"
      onClick={() => setCollapsed((v) => !v)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      sx={{
        color: SIDEBAR_COLOR,
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
  )

  const sidebarContent = (
    <SidebarNav
      collapsed={isMobile ? false : collapsed}
      loggingOut={loggingOut}
      onLogout={() => void logout()}
      onNavigate={isMobile ? () => setMobileNavOpen(false) : undefined}
      showBrand
      headerSlot={isMobile ? undefined : collapseButton}
    />
  )

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'grey.50' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { ...drawerPaperSx, width: DRAWER_EXPANDED, maxWidth: '86vw' } }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            transition: widthTransition,
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            flexShrink: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            pt: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: { xs: 1.5, sm: 2.5 }, gap: 1 }}>
            {isMobile ? (
              <IconButton
                edge="start"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            ) : null}
            <Typography
              variant={isMobile ? 'subtitle1' : 'body2'}
              sx={{
                flex: 1,
                fontWeight: isMobile ? 700 : 500,
                color: isMobile ? 'primary.main' : 'text.secondary',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pageTitle}
            </Typography>
            <AdminUserMenu />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 1.5, sm: 2, md: 2.5 },
            minWidth: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
