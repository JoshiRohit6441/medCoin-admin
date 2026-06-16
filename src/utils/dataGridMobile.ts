import type { SxProps, Theme } from '@mui/material'

export const dataGridHeight = { xs: 440, sm: 520, md: 560 }

export const dataGridSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    minHeight: 52,
  },
  '& .MuiDataGrid-cell': {
    py: 1,
    px: 1.5,
    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
    display: 'flex',
    alignItems: 'center',
    overflow: 'visible',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
  },
  '& .MuiDataGrid-toolbarContainer': {
    borderBottom: '1px solid',
    borderColor: 'divider',
    flexWrap: 'wrap',
    gap: 1,
    px: { xs: 0.5, sm: 1 },
  },
  '& .MuiDataGrid-footerContainer': {
    flexWrap: 'wrap',
    gap: 0.5,
  },
}

export function mobileGridPageSize(defaultDesktop = 25) {
  return { xs: 10, sm: defaultDesktop }
}
