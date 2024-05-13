import { createSlice } from '@reduxjs/toolkit'

interface ProjectState {
  value: DBProject[]
}

// Define the initial state using that type
const initialState: ProjectState = {
  value: []
}

interface State {
  value: DBProject[]
}

interface ReplaceAction {
  payload: DBProject[]
}

interface ReplaceSingleAction {
  payload: {
    name: string
    oldname: string
  }
}

interface AppendAction {
  payload: {
    name: string
  }
}

interface RemoveAction {
  payload: {
    name: string
  }
}

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    replaceProject: (state: State, action: ReplaceSingleAction) => {
      state.value = state.value.map((p: DBProject) => {
        if (p.name === action.payload.oldname) {
          p.name = action.payload.name
          return p
        } else {
          return p
        }
      })
    },
    replaceProjects: (state: State, action: ReplaceAction) => {
      state.value = action.payload
    },
    appendProject: (state: State, action: AppendAction) => {
      // make sure project names are unique
      if (!state.value.some((e: DBProject) => e.name === action.payload.name)) {
        state.value = state.value.concat(action.payload)
      }
    },
    deleteProject: (state: State, action: RemoveAction) => {
      state.value = state.value.filter((p: DBProject) => action.payload.name !== p.name)
    }
  },
})

// Action creators are generated for each case reducer function
export const { replaceProjects, replaceProject, appendProject, deleteProject } = projectsSlice.actions

export const projectsReducer = projectsSlice.reducer;
