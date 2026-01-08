<script lang="ts">
  import { onMount } from 'svelte'
  import {
    projects,
    selectedProject,
    selectedCompany,
    activeTasks,
    selectedTask,
    selectedTaskDefinition,
    projectsForSelectedCompany,
  } from '../stores'
  import EditProjectModal from './modals/EditProjectModal.svelte'
  import DeleteProjectModal from './modals/DeleteProjectModal.svelte'
  import InfoBox from './InfoBox.svelte'

  let projectsList: DBProject[] = []
  let showEditModal = false
  let showDeleteModal = false
  let projectToEdit: DBProject | null = null
  let projectToDelete: DBProject | null = null

  $: activeTasksList = $activeTasks
  $: selectedProj = $selectedProject
  $: selectedComp = $selectedCompany
  $: companyProjects = $projectsForSelectedCompany

  onMount(async () => {
    await fetchProjects()
  })

  projects.subscribe(value => {
    projectsList = value
  })

  selectedCompany.subscribe(async () => {
    if ($selectedCompany.name) {
      await fetchProjects($selectedCompany.name)
    } else {
      projects.set([])
    }
  })

  async function fetchProjects(companyName?: string) {
    if (window.electron) {
      try {
        const data = await window.electron.getProjects(companyName)
        projects.set(data)
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }
  }

  async function handleAddProject(e: Event) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const name = formData.get('name') as string

    if (name && $selectedCompany.name && window.electron) {
      const result = await window.electron.addProject(
        name,
        $selectedCompany.name,
      )
      if (result.success) {
        await fetchProjects($selectedCompany.name)
        form.reset()
      }
    }
  }

  function handleProjectSelect(project: DBProject) {
    selectedTask.set(null)
    selectedTaskDefinition.set(null)
    selectedProject.set({
      name: project.name,
      company_name: project.company_name,
    })
  }

  function handleEditClick(project: DBProject) {
    projectToEdit = project
    showEditModal = true
  }

  function handleDeleteClick(project: DBProject) {
    projectToDelete = project
    showDeleteModal = true
  }

  function handleEditModalClose(success: boolean, editedProject?: DBProject) {
    showEditModal = false
    if (success && editedProject) {
      selectedProject.set({
        name: editedProject.name,
        company_name: editedProject.company_name,
      })
      fetchProjects($selectedCompany.name)
    }
    projectToEdit = null
  }

  function handleDeleteModalClose(success: boolean) {
    showDeleteModal = false
    if (success) {
      selectedProject.set({ name: null, company_name: null })
      fetchProjects($selectedCompany.name)
    }
    projectToDelete = null
  }

  function hasActiveTask(projectName: string): boolean {
    return activeTasksList.some(at => at.project_name === projectName)
  }
</script>

{#if showEditModal && projectToEdit}
  <EditProjectModal project={projectToEdit} onClose={handleEditModalClose} />
{/if}

{#if showDeleteModal && projectToDelete}
  <DeleteProjectModal
    project={projectToDelete}
    onClose={handleDeleteModalClose}
  />
{/if}

<section class="section">
  <h1 class="text-2xl font-bold">Projects</h1>
  <h2 class="text-lg text-base-content/70">
    Manage your projects for {selectedComp.name || 'the selected company'}.
    Select a project to view its tasks.
  </h2>

  {#if !selectedComp.name}
    <InfoBox type="info" title="Select a Company">
      Please select a company first to view and manage its projects.
    </InfoBox>
  {:else}
    <div class="grid grid-cols-3 gap-4 mt-4">
      <!-- New Project -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">New</h2>
          <form on:submit={handleAddProject}>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Project Name</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Project Name"
                class="input input-bordered"
                required
              />
            </div>
            <div class="form-control mt-4">
              <button type="submit" class="btn btn-primary">Add Project</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Available Projects -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Available</h2>
          <div class="space-y-2">
            {#each companyProjects as project}
              <div
                class="p-3 rounded cursor-pointer transition-colors"
                class:bg-primary={selectedProj.name === project.name}
                class:text-primary-content={selectedProj.name === project.name}
                on:click={() => handleProjectSelect(project)}
              >
                <p class="font-semibold">{project.name}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Actions -->
      {#if selectedProj.name}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Actions</h2>
            {#if hasActiveTask(selectedProj.name)}
              <InfoBox type="warning" title="Warning">
                A task belonging to this project is currently active, you need
                to stop it to perform any action.
              </InfoBox>
            {:else}
              <div class="flex gap-2">
                <button
                  class="btn btn-warning"
                  on:click={() =>
                    handleEditClick({
                      name: selectedProj.name!,
                      company_name: selectedProj.company_name!,
                    })}
                >
                  Edit
                </button>
                <button
                  class="btn btn-error"
                  on:click={() =>
                    handleDeleteClick({
                      name: selectedProj.name!,
                      company_name: selectedProj.company_name!,
                    })}
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</section>
