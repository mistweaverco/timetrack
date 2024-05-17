import { createSlice } from '@reduxjs/toolkit'

interface PDFDocumentState {
  value: {
    name: PDFQueryResult[]
  }
}

const initialState: PDFDocumentState = {
  value: {
    name: [],
  },
}

interface State {
  value: PDFDocumentState['value']
}

interface Action {
  payload: PDFDocumentState['value']
  type: string
}

export const pdfDocumentSlice = createSlice({
  name: 'pdfDocument',
  initialState,
  reducers: {
    setPDFDocument: (state: State, action: Action) => {
      state.value = action.payload
    },
    removePDFDocument: (state: State) => {
      state.value = initialState.value
    },
  },
})

export const { setPDFDocument, removePDFDocument } = pdfDocumentSlice.actions
export const pdfDocumentReducer = pdfDocumentSlice.reducer
