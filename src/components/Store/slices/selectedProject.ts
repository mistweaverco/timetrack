import { createSlice } from '@reduxjs/toolkit'

interface SelectedProjectState {
  value: DBProject
}

// Define the initial state using that type
const initialState: SelectedProjectState = {
  value: {
    name: null,
  },
}

interface State {
  value: SelectedProjectState['value']
}

interface Action {
  payload: SelectedProjectState['value']
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
      state.value = {
        name: null,
      }
    },
  },
})

export const { setSelectedProject, removeSelectedProject } =
  selectedProjectSlice.actions
export const selectedProjectReducer = selectedProjectSlice.reducer
