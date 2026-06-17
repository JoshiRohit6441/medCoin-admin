import type { SxProps, Theme } from '@mui/material'
import type { GridColumnVisibilityModel } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { useIsMobile } from '../hooks/useBreakpoint'

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
    overflow: 'hidden',
    minWidth: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    lineHeight: 1.4,
  },
  '& .MuiDataGrid-cell--textLeft, & .MuiDataGrid-cell--textRight, & .MuiDataGrid-cell--textCenter': {
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
  },
  '& .MuiDataGrid-panelContent': {
    maxWidth: { xs: 'calc(100vw - 24px)', sm: 420 },
  },
  '& .MuiDataGrid-columnsManagementRow': {
    minHeight: 44,
  },
  '& .MuiDataGrid-columnsManagementRow .MuiCheckbox-root': {
    p: { xs: 1.25, sm: 1 },
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

/** Keeps column visibility user-editable (required for Manage columns panel). */
export function useResponsiveColumnVisibility(mobileHidden: GridColumnVisibilityModel) {
  const isMobile = useIsMobile()
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({})

  useEffect(() => {
    setColumnVisibilityModel(isMobile ? mobileHidden : {})
  }, [isMobile, mobileHidden])

  return {
    columnVisibilityModel,
    onColumnVisibilityModelChange: setColumnVisibilityModel,
  }
}
