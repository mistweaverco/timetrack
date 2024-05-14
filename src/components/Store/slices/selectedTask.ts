import { createSlice } from '@reduxjs/toolkit'

interface SelectedTaskState {
  value: {
    name: string | null
    date: string | null
    seconds: number | null
    project_name: string | null
  }
}

// Define the initial state using that type
const initialState: SelectedTaskState = {
  value: {
    name: null,
    date: null,
    seconds: null,
    project_name: null
  }
}

interface State {
  value: SelectedTaskState['value']
}

interface Action {
  payload: SelectedTaskState['value']
  type: string
}

export const selectedTaskSlice = createSlice({
  name: 'selectedTask',
  initialState,
  reducers: {
    setSelectedTask: (state: State, action: Action) => {
      state.value = action.payload
    },
    removeSelectedTask: (state: State) => {
      state.value = initialState.value
    }
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedTask, removeSelectedTask } = selectedTaskSlice.actions

export const selectedTaskReducer = selectedTaskSlice.reducer;
