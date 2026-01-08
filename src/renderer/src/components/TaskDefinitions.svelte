<script lang="ts">
  import { onMount } from 'svelte'
  import {
    taskDefinitions,
    selectedProject,
    activeTasks,
    selectedTaskDefinition,
  } from '../stores'
  import EditTaskDefinitionModal from './modals/EditTaskDefinitionModal.svelte'
  import DeleteTaskDefinitionModal from './modals/DeleteTaskDefinitionModal.svelte'
  import InfoBox from './InfoBox.svelte'

  let taskDefs: DBTaskDefinition[] = []
  let showEditModal = false
  let showDeleteModal = false
  let taskDefToEdit: DBTaskDefinition | null = null
  let taskDefToDelete: DBTaskDefinition | null = null

  $: selectedProj = $selectedProject
  $: activeTasksList = $activeTasks

  onMount(async () => {
    taskDefinitions.subscribe(value => {
      taskDefs = value
    })

    selectedProject.subscribe(async proj => {
      if (proj.name) {
        await fetchTaskDefinitions(proj.name)
      }
    })
  })

  async function fetchTaskDefinitions(projectName: string) {
    if (window.electron) {
      try {
        const data = (
          await window.electron.getTaskDefinitions(projectName)
        ).filter((taskDef: DBTaskDefinition) => taskDef.status === 'active')
        taskDefinitions.set(data)
      } catch (error) {
        console.error('Error loading task definitions:', error)
      }
    }
  }

  async function handleAddTaskDefinition(e: Event) {
    e.preventDefault()
    if (!selectedProj.name) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const name = formData.get('name') as string

    if (name && window.electron) {
      const result = await window.electron.addTaskDefinition({
        name,
        project_name: selectedProj.name,
      })
      if (result.success) {
        await fetchTaskDefinitions(selectedProj.name)
        form.reset()
      }
    }
  }

  function handleTaskDefSelect(taskDef: DBTaskDefinition) {
    selectedTaskDefinition.set(taskDef)
  }

  function handleEditClick(taskDef: DBTaskDefinition) {
    taskDefToEdit = taskDef
    showEditModal = true
  }

  function handleDeleteClick(taskDef: DBTaskDefinition) {
    taskDefToDelete = taskDef
    showDeleteModal = true
  }

  function handleEditModalClose(
    success: boolean,
    editedTaskDef?: DBTaskDefinition,
  ) {
    showEditModal = false
    if (success && editedTaskDef) {
      selectedTaskDefinition.set(editedTaskDef)
      if (selectedProj.name) {
        fetchTaskDefinitions(selectedProj.name)
      }
    }
    taskDefToEdit = null
  }

  function handleDeleteModalClose(success: boolean) {
    showDeleteModal = false
    if (success) {
      selectedTaskDefinition.set(null)
      if (selectedProj.name) {
        fetchTaskDefinitions(selectedProj.name)
      }
    }
    taskDefToDelete = null
  }

  function hasActiveTask(taskDefName: string): boolean {
    return activeTasksList.some(
      at => at.name === taskDefName && at.project_name === selectedProj.name,
    )
  }

  function isSelected(taskDef: DBTaskDefinition): boolean {
    const selected = $selectedTaskDefinition
    return (
      selected?.name === taskDef.name &&
      selected?.project_name === taskDef.project_name
    )
  }
</script>

{#if showEditModal && taskDefToEdit}
  <EditTaskDefinitionModal
    taskDefinition={taskDefToEdit}
    onClose={handleEditModalClose}
  />
{/if}

{#if showDeleteModal && taskDefToDelete}
  <DeleteTaskDefinitionModal
    taskDefinition={taskDefToDelete}
    onClose={handleDeleteModalClose}
  />
{/if}

{#if selectedProj.name}
  <section class="section">
    <h1 class="text-2xl font-bold">Task Definitions</h1>
    <h2 class="text-lg text-base-content/70">
      All available task definitions for a given project
    </h2>

    <div class="grid grid-cols-3 gap-4 mt-4">
      <!-- New Task Definition -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">New</h2>
          <form on:submit={handleAddTaskDefinition}>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Task Definition Name</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Task Definition Name"
                class="input input-bordered"
                required
              />
            </div>
            <div class="form-control mt-4">
              <button type="submit" class="btn btn-primary"
                >Add Task Definition</button
              >
            </div>
          </form>
        </div>
      </div>

      <!-- Available Task Definitions -->
      {#if taskDefs.length > 0}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Available</h2>
            <div class="space-y-2">
              {#each taskDefs as taskDef}
                <div
                  class="p-3 rounded cursor-pointer transition-colors flex items-center gap-2"
                  class:bg-primary={isSelected(taskDef)}
                  class:text-primary-content={isSelected(taskDef)}
                  on:click={() => handleTaskDefSelect(taskDef)}
                >
                  <i class="fa-solid fa-book"></i>
                  <p class="font-semibold">{taskDef.name}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      {#if $selectedTaskDefinition}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Actions</h2>
            {#if hasActiveTask($selectedTaskDefinition.name)}
              <InfoBox type="warning" title="Warning">
                A task belonging to this task definition is currently active,
                you need to stop it to perform any action.
              </InfoBox>
            {:else}
              <div class="flex gap-2">
                <button
                  class="btn btn-warning"
                  on:click={() => handleEditClick($selectedTaskDefinition!)}
                >
                  Edit
                </button>
                <button
                  class="btn btn-error"
                  on:click={() => handleDeleteClick($selectedTaskDefinition!)}
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}
