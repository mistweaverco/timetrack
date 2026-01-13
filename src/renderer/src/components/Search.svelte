<script lang="ts">
  import moment from 'moment'
  import { activeTasks, searchResults } from '../stores'
  import EditCompanyModal from './modals/EditCompanyModal.svelte'
  import DeleteCompanyModal from './modals/DeleteCompanyModal.svelte'
  import EditProjectModal from './modals/EditProjectModal.svelte'
  import DeleteProjectModal from './modals/DeleteProjectModal.svelte'
  import EditTaskModal from './modals/EditTaskModal.svelte'
  import DeleteTaskModal from './modals/DeleteTaskModal.svelte'
  import EditTaskDefinitionModal from './modals/EditTaskDefinitionModal.svelte'
  import DeleteTaskDefinitionModal from './modals/DeleteTaskDefinitionModal.svelte'
  import InfoBox from './InfoBox.svelte'
  import { getHMSStringFromSeconds } from '../lib/utils'

  let searchResult: SearchQueryResult | null = null
  let loading = false
  let showEditCompanyModal = false
  let showDeleteCompanyModal = false
  let showEditProjectModal = false
  let showDeleteProjectModal = false
  let showEditTaskModal = false
  let showDeleteTaskModal = false
  let showEditTaskDefModal = false
  let showDeleteTaskDefModal = false

  let companyToEdit: DBCompany | null = null
  let companyToDelete: DBCompany | null = null
  let projectToEdit: DBProject | null = null
  let projectToDelete: DBProject | null = null
  let taskToEdit: DBTask | null = null
  let taskToDelete: DBTask | null = null
  let taskDefToEdit: DBTaskDefinition | null = null
  let taskDefToDelete: DBTaskDefinition | null = null

  // Form values
  let searchIn: string[] = []
  let fromDate = moment().format('YYYY-MM-DD')
  let toDate = moment().format('YYYY-MM-DD')
  let activeState = 'all'
  let companyName = '*'
  let projectName = '*'
  let taskName = '*'
  let taskDescription = '*'
  let taskDefinitionName = '*'

  $: activeTasksList = $activeTasks

  // Reactive form validation
  $: formValid =
    searchIn.length > 0 &&
    !!fromDate &&
    !!toDate &&
    !!activeState &&
    !!companyName &&
    !!projectName &&
    !!taskName &&
    !!taskDescription &&
    !!taskDefinitionName

  async function handleSearch(e: Event) {
    e.preventDefault()
    if (!formValid) return

    loading = true
    searchResult = null

    try {
      const query: SearchQuery = {
        search_in: searchIn,
        from_date: fromDate,
        to_date: toDate,
        active_state: activeState,
        task: {
          company_name: companyName,
          project_name: projectName,
          task_name: taskName,
          task_definition_name: taskDefinitionName,
          task_description: taskDescription,
        },
      }

      if (window.electron) {
        const result = await window.electron.getSearchResult(query)
        searchResult = result
        searchResults.set(result)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      loading = false
    }
  }

  function hasActiveTask(projectName: string): boolean {
    // Note: This checks by project name for display purposes
    // ActiveTask now uses taskId, so we need to check by projectName from the task
    return activeTasksList.some(at => at.projectName === projectName)
  }

  function hasActiveTaskForTaskDef(taskDef: DBTaskDefinition): boolean {
    // Note: This is a simplified check - we'd need to fetch tasks to match properly
    // For now, check by name/projectName which are display fields
    return activeTasksList.some(
      at => at.name === taskDef.name && at.projectName === taskDef.projectName,
    )
  }

  function hasActiveTaskForTask(task: DBTask): boolean {
    return activeTasksList.some(
      at => at.taskId === task.id && at.date === task.date,
    )
  }

  function handleEditProject(project: DBProject) {
    projectToEdit = project
    showEditProjectModal = true
  }

  function handleDeleteProject(project: DBProject) {
    projectToDelete = project
    showDeleteProjectModal = true
  }

  function handleEditTask(task: DBTask) {
    taskToEdit = task
    showEditTaskModal = true
  }

  function handleDeleteTask(task: DBTask) {
    taskToDelete = task
    showDeleteTaskModal = true
  }

  function handleEditTaskDef(taskDef: DBTaskDefinition) {
    taskDefToEdit = taskDef
    showEditTaskDefModal = true
  }

  function handleDeleteTaskDef(taskDef: DBTaskDefinition) {
    taskDefToDelete = taskDef
    showDeleteTaskDefModal = true
  }

  function handleEditCompany(company: DBCompany) {
    companyToEdit = company
    showEditCompanyModal = true
  }

  function handleDeleteCompany(company: DBCompany) {
    companyToDelete = company
    showDeleteCompanyModal = true
  }

  function handleProjectModalClose(
    success: boolean,
    editedProject?: DBProject,
  ) {
    showEditProjectModal = false
    showDeleteProjectModal = false
    if (success && searchResult) {
      if (editedProject && projectToEdit) {
        searchResult.projects = searchResult.projects.map(p =>
          p.id === projectToEdit.id ? editedProject : p,
        )
      } else if (projectToDelete) {
        searchResult.projects = searchResult.projects.filter(
          p => p.id !== projectToDelete.id,
        )
      }
      searchResults.set(searchResult)
    }
    projectToEdit = null
    projectToDelete = null
  }

  function handleTaskModalClose(success: boolean, editedTask?: DBTask) {
    showEditTaskModal = false
    showDeleteTaskModal = false
    if (success && searchResult) {
      if (editedTask && taskToEdit) {
        searchResult.tasks = searchResult.tasks.map(t =>
          t.id === taskToEdit.id ? editedTask : t,
        )
      } else if (taskToDelete) {
        searchResult.tasks = searchResult.tasks.filter(
          t => t.id !== taskToDelete.id,
        )
      }
      searchResults.set(searchResult)
    }
    taskToEdit = null
    taskToDelete = null
  }

  function handleTaskDefModalClose(
    success: boolean,
    editedTaskDef?: DBTaskDefinition,
  ) {
    showEditTaskDefModal = false
    showDeleteTaskDefModal = false
    if (success && searchResult) {
      if (editedTaskDef && taskDefToEdit) {
        searchResult.task_definitions = searchResult.task_definitions.map(td =>
          td.id === taskDefToEdit.id ? editedTaskDef : td,
        )
      } else if (taskDefToDelete) {
        searchResult.task_definitions = searchResult.task_definitions.filter(
          td => td.id !== taskDefToDelete.id,
        )
      }
      searchResults.set(searchResult)
    }
    taskDefToEdit = null
    taskDefToDelete = null
  }

  function handleCompanyModalClose(
    success: boolean,
    editedCompany?: DBCompany,
  ) {
    showEditCompanyModal = false
    showDeleteCompanyModal = false
    if (success && searchResult) {
      if (editedCompany && companyToEdit) {
        searchResult.companies = searchResult.companies.map(c =>
          c.id === companyToEdit.id ? editedCompany : c,
        )
      } else if (companyToDelete) {
        searchResult.companies = searchResult.companies.filter(
          c => c.id !== companyToDelete.id,
        )
      }
      searchResults.set(searchResult)
    }
    companyToEdit = null
    companyToDelete = null
  }
</script>

{#if showEditCompanyModal && companyToEdit}
  <EditCompanyModal
    company={companyToEdit}
    onClose={(s, c) => handleCompanyModalClose(s, c)}
  />
{/if}

{#if showDeleteCompanyModal && companyToDelete}
  <DeleteCompanyModal
    company={companyToDelete}
    onClose={s => handleCompanyModalClose(s)}
  />
{/if}

{#if showEditProjectModal && projectToEdit}
  <EditProjectModal
    project={projectToEdit}
    onClose={(s, p) => handleProjectModalClose(s, p)}
  />
{/if}

{#if showDeleteProjectModal && projectToDelete}
  <DeleteProjectModal
    project={projectToDelete}
    onClose={s => handleProjectModalClose(s)}
  />
{/if}

{#if showEditTaskModal && taskToEdit}
  <EditTaskModal
    task={taskToEdit}
    onClose={(s, t) => handleTaskModalClose(s, t)}
  />
{/if}

{#if showDeleteTaskModal && taskToDelete}
  <DeleteTaskModal task={taskToDelete} onClose={s => handleTaskModalClose(s)} />
{/if}

{#if showEditTaskDefModal && taskDefToEdit}
  <EditTaskDefinitionModal
    taskDefinition={taskDefToEdit}
    onClose={(s, td) => handleTaskDefModalClose(s, td)}
  />
{/if}

{#if showDeleteTaskDefModal && taskDefToDelete}
  <DeleteTaskDefinitionModal
    taskDefinition={taskDefToDelete}
    onClose={s => handleTaskDefModalClose(s)}
  />
{/if}

<section class="section">
  <h1 class="text-2xl font-bold">Search</h1>
  <h2 class="text-lg text-base-content/70">
    You can search across tasks and projects.
  </h2>

  <form on:submit={handleSearch} class="mt-4">
    <div class="grid grid-cols-3 gap-4">
      <!-- Query Form -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Query</h2>

          <div class="form-control">
            <label class="label" for="searchIn">
              <span class="label-text">Search in</span>
            </label>
            <select
              id="searchIn"
              multiple
              class="select select-bordered select-multiple"
              bind:value={searchIn}
              required
            >
              <option value="companies">Companies</option>
              <option value="projects">Projects</option>
              <option value="task_definitions">Task Definitions</option>
              <option value="tasks">Tasks</option>
            </select>
            <label class="label" for="searchIn">
              <span class="label-text-alt"
                >Hold Ctrl/Cmd to select multiple</span
              >
            </label>
          </div>

          <div class="form-control mt-2">
            <label class="label" for="fromDate">
              <span class="label-text">From</span>
            </label>
            <input
              id="fromDate"
              type="date"
              bind:value={fromDate}
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="toDate">
              <span class="label-text">To</span>
            </label>
            <input
              id="toDate"
              type="date"
              bind:value={toDate}
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="activeState">
              <span class="label-text">Active State</span>
            </label>
            <select
              id="activeState"
              bind:value={activeState}
              class="select select-bordered"
              required
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="form-control mt-2">
            <label class="label" for="companyName">
              <span class="label-text">Company Name</span>
            </label>
            <input
              id="companyName"
              type="text"
              bind:value={companyName}
              placeholder="Company Name (* for all)"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="projectName">
              <span class="label-text">Project Name</span>
            </label>
            <input
              id="projectName"
              type="text"
              bind:value={projectName}
              placeholder="Project Name (* for all)"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="taskName">
              <span class="label-text">Task Name</span>
            </label>
            <input
              id="taskName"
              type="text"
              bind:value={taskName}
              placeholder="Task Name (* for all)"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="taskDescription">
              <span class="label-text">Task Description</span>
            </label>
            <input
              id="taskDescription"
              type="text"
              bind:value={taskDescription}
              placeholder="Task Description (* for all)"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-2">
            <label class="label" for="taskDefinitionName">
              <span class="label-text">Task Definition Name</span>
            </label>
            <input
              id="taskDefinitionName"
              type="text"
              bind:value={taskDefinitionName}
              placeholder="Task Definition Name (* for all)"
              class="input input-bordered"
              required
            />
          </div>

          <div class="form-control mt-4">
            <button
              type="submit"
              class="btn btn-primary w-full"
              disabled={!formValid || loading}
            >
              {#if loading}
                <span class="loading loading-spinner"></span>
                Searching...
              {:else}
                Search
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Results -->
      {#if loading}
        <div class="card bg-base-200 shadow-xl col-span-2">
          <div class="card-body">
            <h2 class="card-title">Loading</h2>
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      {:else if searchResult}
        <div class="col-span-2 space-y-4">
          <!-- Companies Results -->
          {#if searchIn.includes('companies') && searchResult.companies.length > 0}
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Companies</h2>
                <div class="space-y-2">
                  {#each searchResult.companies as company (company.name)}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <div class="flex items-center justify-between">
                          <div>
                            <h3 class="card-title text-lg">{company.name}</h3>
                            {#if company.status}
                              <span
                                class="badge {company.status === 'active'
                                  ? 'badge-success'
                                  : 'badge-error'}"
                              >
                                {company.status}
                              </span>
                            {/if}
                          </div>
                          <div class="card-actions">
                            <button
                              class="btn btn-warning btn-sm"
                              on:click={() => handleEditCompany(company)}
                            >
                              Edit
                            </button>
                            <button
                              class="btn btn-error btn-sm"
                              on:click={() => handleDeleteCompany(company)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Projects Results -->
          {#if searchIn.includes('projects') && searchResult.projects.length > 0}
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Projects</h2>
                <div class="space-y-2">
                  {#each searchResult.projects as project (project.name)}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <h3 class="card-title text-lg">{project.name}</h3>
                        <div class="card-actions justify-end">
                          {#if hasActiveTask(project.name)}
                            <InfoBox type="warning" title="Warning">
                              A task belonging to this project is currently
                              active, you need to stop it to perform any action.
                            </InfoBox>
                          {:else}
                            <button
                              class="btn btn-warning btn-sm"
                              on:click={() => handleEditProject(project)}
                            >
                              Edit
                            </button>
                            <button
                              class="btn btn-error btn-sm"
                              on:click={() => handleDeleteProject(project)}
                            >
                              Delete
                            </button>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Task Definitions Results -->
          {#if searchIn.includes('task_definitions') && searchResult.task_definitions.length > 0}
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Task Definitions</h2>
                <div class="space-y-2">
                  {#each searchResult.task_definitions as taskDef (taskDef.name)}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <h3 class="card-title text-lg">{taskDef.name}</h3>
                        <p class="text-sm text-base-content/70">
                          {taskDef.project_name}
                        </p>
                        <div class="card-actions justify-end">
                          {#if hasActiveTaskForTaskDef(taskDef)}
                            <InfoBox type="warning" title="Warning">
                              A task belonging to this task definition is
                              currently active, you need to stop it to perform
                              any action.
                            </InfoBox>
                          {:else}
                            <button
                              class="btn btn-warning btn-sm"
                              on:click={() => handleEditTaskDef(taskDef)}
                            >
                              Edit
                            </button>
                            <button
                              class="btn btn-error btn-sm"
                              on:click={() => handleDeleteTaskDef(taskDef)}
                            >
                              Delete
                            </button>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Tasks Results -->
          {#if searchIn.includes('tasks') && searchResult.tasks.length > 0}
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Tasks</h2>
                <div class="space-y-2">
                  {#each searchResult.tasks as task (task.name + task.date)}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <h3 class="card-title text-lg">{task.name}</h3>
                        <p class="text-sm text-base-content/70">
                          {task.projectName}
                        </p>
                        {#if task.description}
                          <p class="text-sm">{task.description}</p>
                        {/if}
                        <div class="flex gap-4 text-sm">
                          <div class="flex items-center gap-1">
                            <i class="fa-solid fa-calendar"></i>
                            <span>{task.date}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <i class="fa-solid fa-clock"></i>
                            <span>{getHMSStringFromSeconds(task.seconds)}</span>
                          </div>
                        </div>
                        <div class="card-actions justify-end">
                          {#if hasActiveTaskForTask(task)}
                            <InfoBox type="warning" title="Warning">
                              This task is currently active, you need to stop it
                              to perform any action.
                            </InfoBox>
                          {:else}
                            <button
                              class="btn btn-warning btn-sm"
                              on:click={() => handleEditTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              class="btn btn-error btn-sm"
                              on:click={() => handleDeleteTask(task)}
                            >
                              Delete
                            </button>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          {#if searchResult.companies.length === 0 && searchResult.projects.length === 0 && searchResult.task_definitions.length === 0 && searchResult.tasks.length === 0}
            <div class="alert alert-info">
              <span>No results found</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </form>
</section>
