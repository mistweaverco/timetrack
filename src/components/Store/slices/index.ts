import { combineReducers } from 'redux'
import { projectsReducer } from './projects'
import { selectedProjectReducer } from './selectedProject'
import { tasksReducer } from './tasks'

export const rootReducer = combineReducers({
  projectsReducer,
  selectedProjectReducer,
  tasksReducer,
})
