import { configureStore } from '@reduxjs/toolkit'
import { projectsReducer } from './slices/projects';
import { selectedProjectReducer } from './slices/selectedProject';
import { taskDefinitionsReducer } from './slices/taskDefinitions';
import { selectedTaskDefinitionReducer } from './slices/selectedTaskDefinition';
import { tasksReducer } from './slices/tasks';
import { selectedTaskReducer } from './slices/selectedTask';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    selectedProject: selectedProjectReducer,
    taskDefinitions: taskDefinitionsReducer,
    selectedTaskDefinitionReducer: selectedTaskDefinitionReducer,
    tasks: tasksReducer,
    selectedTask: selectedTaskReducer,
  },
})

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type
export type AppDispatch = typeof store.dispatch
