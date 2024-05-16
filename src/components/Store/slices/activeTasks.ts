import { createSlice } from '@reduxjs/toolkit'

interface ActiveTasksState {
  value: ActiveTask[]
}

// Define the initial state using that type
const initialState: ActiveTasksState = {
  value: []
}

interface State {
  value: ActiveTask[]
}

interface ReplaceAction {
  payload: ActiveTask[]
}

interface ReplaceSingleAction {
  payload: {
    name: string
    description: string
    project_name: string
    oldname: string
    seconds: number
    date: string
    isActive: boolean
  }
}

interface AppendAction {
  payload: ActiveTask
}

interface PauseAction {
  payload: {
    name: string
    project_name: string
    date: string
  }
}

interface RemoveAction {
  payload: {
    name: string
    project_name: string
    date: string
  }
}
interface UpdateSecondsAction {
  payload: {
    name: string
    project_name: string
    date: string
    seconds: number
  }
}

export const activeTasksSlice = createSlice({
  name: 'activeTasks',
  initialState,
  reducers: {
    replaceActiveTask: (state: State, action: ReplaceSingleAction) => {
      state.value = state.value.map((t: ActiveTask) => {
        if (t.name === action.payload.oldname && t.date === action.payload.date && t.project_name === action.payload.project_name) {
          t.name = action.payload.name
          t.isActive = action.payload.isActive
          t.seconds = action.payload.seconds
          t.description = action.payload.description
          return t
        } else {
          return t
        }
      })
    },
    updateActiveTaskSeconds: (state: State, action: UpdateSecondsAction) => {
      state.value = state.value.map((t: ActiveTask) => {
        if (t.name === action.payload.name && t.date === action.payload.date && t.project_name === action.payload.project_name) {
          t.seconds = action.payload.seconds
          return t
        } else {
          return t
        }
      })
    },
    pauseActiveTask: (state: State, action: PauseAction) => {
      state.value = state.value.map((t: ActiveTask) => {
        if (t.name === action.payload.name && t.date === action.payload.date && t.project_name === action.payload.project_name) {
          t.isActive = false
          return t
        } else {
          return t
        }
      })
    },
    replaceActiveTasks: (state: State, action: ReplaceAction) => {
      state.value = action.payload
    },
    appendActiveTask: (state: State, action: AppendAction) => {
      // make sure tasks are unique
      const f = (e: ActiveTask) => {
          e.name === action.payload.name &&
          e.date === action.payload.date &&
          e.project_name === action.payload.project_name
      }
      if (!state.value.some(f)) {
        state.value = state.value.concat(action.payload)
      }
    },
    removeActiveTask: (state: State, action: RemoveAction) => {
      state.value = state.value.filter((t: ActiveTask) => action.payload.name !== t.name)
    }
  },
})

export const { replaceActiveTasks, replaceActiveTask, appendActiveTask, removeActiveTask, pauseActiveTask, updateActiveTaskSeconds } = activeTasksSlice.actions
export const activeTasksReducer = activeTasksSlice.reducer;
