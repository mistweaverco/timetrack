import { createSlice } from '@reduxjs/toolkit'

interface SelectedProjectState {
  value: string | null
}

// Define the initial state using that type
const initialState: SelectedProjectState = {
  value: null
}

interface State {
  value: string | null
}

interface Action {
  payload: string | null
  type: string
}

export const selectedProjectSlice = createSlice({
  name: 'selectedProject',
  initialState,
  reducers: {
    setSelectedProject: (state: State, action: Action) => {
      state.value = action.payload
    },
    removeSelectedProject: (state: State) => {
      state.value = null
    }
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedProject, removeSelectedProject } = selectedProjectSlice.actions

export const selectedProjectReducer = selectedProjectSlice.reducer;
