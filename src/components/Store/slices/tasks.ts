import { createSlice } from '@reduxjs/toolkit'

interface TaskState {
  value: DBTask[]
}

// Define the initial state using that type
const initialState: TaskState = {
  value: [],
}

interface State {
  value: DBTask[]
}

interface ReplaceAction {
  payload: DBTask[]
}

interface ReplaceSingleAction {
  payload: {
    name: string
    project_name: string
    oldname: string
    date: string
    seconds: number
    description: string
  }
}

interface AppendAction {
  payload: DBTask
}

interface RemoveAction {
  payload: {
    name: string
    project_name: string
    date: string
  }
}

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    replaceTask: (state: State, action: ReplaceSingleAction) => {
      state.value = state.value.map((t: DBTask) => {
        if (
          t.name === action.payload.oldname &&
          t.date === action.payload.date &&
          t.project_name === action.payload.project_name
        ) {
          t = action.payload
          return t
        } else {
          return t
        }
      })
    },
    replaceTasks: (state: State, action: ReplaceAction) => {
      state.value = action.payload
    },
    appendTask: (state: State, action: AppendAction) => {
      // make sure tasks are unique
      const f = (e: DBTask) => {
        e.name === action.payload.name &&
          e.date === action.payload.date &&
          e.project_name === action.payload.project_name
      }
      if (!state.value.some(f)) {
        state.value = state.value.concat(action.payload)
      }
    },
    deleteTask: (state: State, action: RemoveAction) => {
      const idx = state.value.findIndex(
        t =>
          t.name === action.payload.name &&
          t.project_name === action.payload.project_name &&
          t.date === action.payload.date,
      )
      state.value.splice(idx, 1)
    },
  },
})

export const { replaceTasks, replaceTask, appendTask, deleteTask } =
  tasksSlice.actions
export const tasksReducer = tasksSlice.reducer
