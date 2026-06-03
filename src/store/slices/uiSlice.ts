import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UiState = {
  modal: {
    open: boolean
    title: string
    message: string
  }
}

const initialState: UiState = {
  modal: {
    open: false,
    title: '',
    message: '',
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ title: string; message: string } | undefined>,
    ) => {
      state.modal.open = true
      state.modal.title = action.payload?.title ?? 'Notice'
      state.modal.message =
        action.payload?.message ?? 'This dialog is controlled from Redux.'
    },
    closeModal: (state) => {
      state.modal.open = false
    },
  },
})

export const { openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
