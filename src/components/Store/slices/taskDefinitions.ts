import { createSlice } from '@reduxjs/toolkit'

interface TaskDefinitionState {
  value: DBTaskDefinition[]
}

// Define the initial state using that type
const initialState: TaskDefinitionState = {
  value: []
}

interface State {
  value: DBTaskDefinition[]
}

interface ReplaceAction {
  payload: DBTaskDefinition[]
}

interface ReplaceSingleAction {
  payload: {
    name: string
    oldname: string
    project_name: string
  }
}

interface AppendAction {
  payload: DBTaskDefinition
}

interface RemoveAction {
  payload: {
    name: string
    project_name: string
  }
}

export const taskDefinitionSlice = createSlice({
  name: 'taskDefinitions',
  initialState,
  reducers: {
    replaceTaskDefinition: (state: State, action: ReplaceSingleAction) => {
      state.value = state.value.map((t: DBTask) => {
        if (t.name === action.payload.oldname && t.project_name === action.payload.project_name) {
          t.name = action.payload.name
          return t
        } else {
          return t
        }
      })
    },
    replaceTaskDefinitions: (state: State, action: ReplaceAction) => {
      state.value = action.payload
    },
    appendTaskDefinition: (state: State, action: AppendAction) => {
      // make sure task task-definitions are unique
      const f = (e: DBTaskDefinition) => {
          e.name === action.payload.name &&
          e.project_name === action.payload.project_name
      }
      if (!state.value.some(f)) {
        state.value = state.value.concat(action.payload)
      }
    },
    removeTaskDefinition: (state: State, action: RemoveAction) => {
      const f = (t: DBTaskDefinition) => (action.payload.name !== t.name && action.payload.project_name !== t.project_name)
      state.value = state.value.filter(f)
    }
  },
})

// Action creators are generated for each case reducer function
export const { replaceTaskDefinitions, replaceTaskDefinition, appendTaskDefinition, removeTaskDefinition } = taskDefinitionSlice.actions

export const taskDefinitionsReducer = taskDefinitionSlice.reducer;
