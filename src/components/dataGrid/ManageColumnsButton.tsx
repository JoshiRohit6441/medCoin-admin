import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined'
import { Button } from '@mui/material'
import { GridPreferencePanelsValue, type GridApiCommon } from '@mui/x-data-grid'
import type { RefObject } from 'react'
import { pageButtonProps } from '../../utils/pageButtons'

type ManageColumnsButtonProps = {
  apiRef: RefObject<GridApiCommon | null>
}

export default function ManageColumnsButton({ apiRef }: ManageColumnsButtonProps) {
  return (
    <Button
      {...pageButtonProps}
      startIcon={<ViewColumnOutlinedIcon fontSize="small" />}
      onClick={() => apiRef.current?.showPreferences(GridPreferencePanelsValue.columns)}
    >
      Manage columns
    </Button>
  )
}
