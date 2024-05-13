import { createSlice } from '@reduxjs/toolkit'

interface SelectedTaskDefinitionState {
  value: string | null
}

// Define the initial state using that type
const initialState: SelectedTaskDefinitionState = {
  value: null
}

interface State {
  value: string | null
}

interface Action {
  payload: string | null
  type: string
}

export const selectedTaskDefinitionSlice = createSlice({
  name: 'selectedTaskDefinition',
  initialState,
  reducers: {
    setSelectedTaskDefinition: (state: State, action: Action) => {
      state.value = action.payload
    },
    removeSelectedTaskDefinition: (state: State) => {
      state.value = null
    }
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedTaskDefinition, removeSelectedTaskDefinition } = selectedTaskDefinitionSlice.actions

export const selectedTaskDefinitionReducer = selectedTaskDefinitionSlice.reducer;
