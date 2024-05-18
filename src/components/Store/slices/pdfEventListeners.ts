import { createSlice } from '@reduxjs/toolkit'

interface PDFEventlistenersState {
  value: {
    added: boolean
  }
}

const initialState: PDFEventlistenersState = {
  value: {
    added: false,
  },
}

interface State {
  value: PDFEventlistenersState['value']
}

export const pdfEventlistenersSlice = createSlice({
  name: 'pdfDocument',
  initialState,
  reducers: {
    setPDFEventlisteners: (state: State) => {
      state.value = {
        added: true,
      }
    },
    removePDFEventlisteners: (state: State) => {
      state.value = {
        added: false,
      }
    },
  },
})

export const { setPDFEventlisteners, removePDFEventlisteners } =
  pdfEventlistenersSlice.actions
export const pdfEventlistenersReducer = pdfEventlistenersSlice.reducer
