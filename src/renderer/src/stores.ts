import { writable, derived } from 'svelte/store'

export const selectedPanel = writable<string>('Overview')
export const selectedCompany = writable<{ name: string | null }>({ name: null })
export const selectedProject = writable<{
  name: string | null
  company_name: string | null
}>({ name: null, company_name: null })
export const selectedTask = writable<DBTask | null>(null)
export const selectedTaskDefinition = writable<DBTaskDefinition | null>(null)

// Data stores
export const companies = writable<DBCompany[]>([])
export const projects = writable<DBProject[]>([])
export const tasks = writable<DBTask[]>([])
export const taskDefinitions = writable<DBTaskDefinition[]>([])
export const activeTasks = writable<ActiveTask[]>([])
export const searchResults = writable<SearchQueryResult | null>(null)

// Derived stores
export const projectsForSelectedCompany = derived(
  [projects, selectedCompany],
  ([$projects, $selectedCompany]) => {
    if (!$selectedCompany.name) return []
    return $projects.filter(p => p.company_name === $selectedCompany.name)
  },
)

export const tasksForSelectedProject = derived(
  [tasks, selectedProject],
  ([$tasks, $selectedProject]) => {
    if (!$selectedProject.name) return []
    return $tasks.filter(t => t.project_name === $selectedProject.name)
  },
)

export const taskDefinitionsForSelectedProject = derived(
  [taskDefinitions, selectedProject],
  ([$taskDefinitions, $selectedProject]) => {
    if (!$selectedProject.name) return []
    return $taskDefinitions.filter(
      td => td.project_name === $selectedProject.name,
    )
  },
)
