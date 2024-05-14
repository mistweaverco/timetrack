import { configureStore } from '@reduxjs/toolkit'
import { selectedPanelReducer } from './slices/selectedPanel';
import { projectsReducer } from './slices/projects';
import { selectedProjectReducer } from './slices/selectedProject';
import { taskDefinitionsReducer } from './slices/taskDefinitions';
import { selectedTaskDefinitionReducer } from './slices/selectedTaskDefinition';
import { tasksReducer } from './slices/tasks';
import { selectedTaskReducer } from './slices/selectedTask';
import { activeTasksReducer } from './slices/activeTasks';
import { pdfDocumentReducer } from './slices/pdfDocument';


export const store = configureStore({
  reducer: {
    selectedPanel: selectedPanelReducer,
    projects: projectsReducer,
    selectedProject: selectedProjectReducer,
    taskDefinitions: taskDefinitionsReducer,
    selectedTaskDefinition: selectedTaskDefinitionReducer,
    tasks: tasksReducer,
    selectedTask: selectedTaskReducer,
    activeTasks: activeTasksReducer,
    pdfDocument: pdfDocumentReducer,
  },
})

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type
export type AppDispatch = typeof store.dispatch
