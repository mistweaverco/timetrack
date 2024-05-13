import { createSlice } from '@reduxjs/toolkit'

interface TaskState {
  value: DBTask[]
}

// Define the initial state using that type
const initialState: TaskState = {
  value: []
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
    oldname: string
  }
}

interface AppendAction {
  payload: DBTask
}

interface RemoveAction {
  payload: {
    name: string
  }
}

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    replaceTask: (state: State, action: ReplaceSingleAction) => {
      state.value = state.value.map((t: DBTask) => {
        if (t.name === action.payload.oldname) {
          t.name = action.payload.name
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
      state.value = state.value.filter((t: DBTask) => action.payload.name !== t.name)
    }
  },
})

// Action creators are generated for each case reducer function
export const { replaceTasks, replaceTask, appendTask, deleteTask } = tasksSlice.actions

export const tasksReducer = tasksSlice.reducer;
