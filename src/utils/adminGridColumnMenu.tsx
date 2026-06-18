import { forwardRef } from 'react'
import {
  GridColumnMenu,
  GRID_COLUMN_MENU_SLOTS,
  type GridColumnMenuProps,
} from '@mui/x-data-grid'

/** Column menu with sort only — use the global Manage columns button above each table. */
export const AdminGridColumnMenu = forwardRef<HTMLUListElement, GridColumnMenuProps>(
  function AdminGridColumnMenu(props, ref) {
    return (
      <GridColumnMenu
        {...props}
        ref={ref}
        slots={{
          columnMenuSortItem: GRID_COLUMN_MENU_SLOTS.columnMenuSortItem,
          columnMenuFilterItem: null,
          columnMenuColumnsItem: null,
        }}
      />
    )
  },
)
