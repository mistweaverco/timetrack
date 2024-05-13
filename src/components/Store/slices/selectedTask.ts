import { createSlice } from '@reduxjs/toolkit'

interface SelectedTaskState {
  value: string | null
}

// Define the initial state using that type
const initialState: SelectedTaskState = {
  value: null
}

interface State {
  value: string | null
}

interface Action {
  payload: string | null
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
      state.value = null
    }
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedTask, removeSelectedTask } = selectedTaskSlice.actions

export const selectedTaskReducer = selectedTaskSlice.reducer;
