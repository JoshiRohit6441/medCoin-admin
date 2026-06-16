import type { SxProps, Theme } from '@mui/material'

/** Shared button styling for admin list pages (toolbar, table actions, drawers). */
export const pageButtonProps = {
  size: 'small' as const,
  variant: 'outlined' as const,
}

export const pageDrawerCloseSx = { mt: 2 }

/** Consistent pill badges in data tables (status, payment, timing). */
export const pageStatusChipSx: SxProps<Theme> = {
  fontWeight: 600,
  height: 28,
  maxWidth: '100%',
  '& .MuiChip-label': {
    px: 1.25,
  },
}

/** Horizontal stack for table row action buttons. */
export const pageTableActionStackSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'nowrap',
  gap: 1,
  width: '100%',
  py: 0.5,
}

/** Wrapper so chips/buttons align inside DataGrid cells without clipping. */
export const pageDataGridCellSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 32,
  overflow: 'visible',
}

export const pageDataGridDefaults = {
  rowHeight: 52,
  density: 'standard' as const,
}
