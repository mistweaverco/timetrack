import { createSlice } from '@reduxjs/toolkit'

interface SelectedTaskDefinitionState {
  value: {
    name: string | null
    project_name: string | null
  }
}

// Define the initial state using that type
const initialState: SelectedTaskDefinitionState = {
  value: {
    name: null,
    project_name: null
  }
}

interface State {
  value: SelectedTaskDefinitionState['value']
}

interface Action {
  payload: SelectedTaskDefinitionState['value']
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
      state.value = initialState.value
    }
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedTaskDefinition, removeSelectedTaskDefinition } = selectedTaskDefinitionSlice.actions

export const selectedTaskDefinitionReducer = selectedTaskDefinitionSlice.reducer;
