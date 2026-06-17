import { forwardRef } from 'react'
import {
  GridColumnMenu,
  GRID_COLUMN_MENU_SLOTS,
  type GridColumnMenuProps,
} from '@mui/x-data-grid'
import { GridColumnMenuManageItem } from '@mui/x-data-grid/components'

/** Column menu with sort + Manage columns only (no Filter, no Hide column). */
export const AdminGridColumnMenu = forwardRef<HTMLUListElement, GridColumnMenuProps>(
  function AdminGridColumnMenu(props, ref) {
    return (
      <GridColumnMenu
        {...props}
        ref={ref}
        slots={{
          columnMenuSortItem: GRID_COLUMN_MENU_SLOTS.columnMenuSortItem,
          columnMenuFilterItem: null,
          columnMenuColumnsItem: GridColumnMenuManageItem,
        }}
      />
    )
  },
)
