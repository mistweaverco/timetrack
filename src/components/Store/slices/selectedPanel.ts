import { createSlice } from '@reduxjs/toolkit'

interface SelectedPanelState {
  value: {
    name: string
  }
}

const initialState: SelectedPanelState = {
  value: {
    name: 'Overview'
  }
}

interface State {
  value: SelectedPanelState['value']
}

interface Action {
  payload: SelectedPanelState['value']
  type: string
}

export const selectedPanelSlice = createSlice({
  name: 'selectedProject',
  initialState,
  reducers: {
    setSelectedPanel: (state: State, action: Action) => {
      state.value = action.payload
    },
    removeSelectedPanel: (state: State) => {
      state.value = initialState.value
    }
  },
})

export const { setSelectedPanel, removeSelectedPanel } = selectedPanelSlice.actions
export const selectedPanelReducer = selectedPanelSlice.reducer;
