<script lang="ts">
  import {
    projects,
    selectedProject,
    selectedCompany,
    selectedTask,
    selectedTaskDefinition,
    projectsForSelectedCompany,
  } from '../stores'
  import EditProjectModal from './modals/EditProjectModal.svelte'
  import DeleteProjectModal from './modals/DeleteProjectModal.svelte'
  import { Plus, Folder, Trash, SquarePen } from '@lucide/svelte'

  let showEditModal = $state(false)
  let showDeleteModal = $state(false)
  let projectToEdit: DBProject | null = $state(null)
  let projectToDelete: DBProject | null = $state(null)

  const companyProjects = $derived(projectsForSelectedCompany)

  selectedCompany.subscribe(async value => {
    if (value && value.id) {
      await fetchProjects(value.id)
    } else {
      projects.set([])
    }
  })

  async function fetchProjects(companyId?: string) {
    if (window.electron) {
      try {
        const data = await window.electron.getProjects(companyId)
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

    if (name && $selectedCompany.id && window.electron) {
      const result = await window.electron.addProject(name, $selectedCompany.id)
      if (result.success) {
        await fetchProjects($selectedCompany.id)
        form.reset()
      }
    }
  }

  function handleProjectSelect(e: Event) {
    const select = e.target as HTMLSelectElement
    const projectId = select.value
    if (projectId === '') {
      selectedProject.set(null)
      selectedTask.set(null)
      selectedTaskDefinition.set(null)
      return
    }
    const project = $companyProjects.find(p => p.id === projectId) || null
    selectedTask.set(null)
    selectedTaskDefinition.set(null)
    selectedProject.set(project)
  }

  function handleEditClick() {
    showEditModal = true
  }

  function handleDeleteClick() {
    showDeleteModal = true
  }

  function handleEditModalClose(success: boolean, editedProject?: DBProject) {
    showEditModal = false
    if (success && editedProject) {
      selectedProject.set(editedProject)
      fetchProjects($selectedCompany.id || undefined)
    }
    projectToEdit = null
  }

  function handleDeleteModalClose(success: boolean) {
    showDeleteModal = false
    if (success) {
      selectedProject.set(null)
      fetchProjects($selectedCompany.id || undefined)
    }
    projectToDelete = null
  }
</script>

{#if showEditModal && projectToEdit}
  <EditProjectModal project={projectToEdit} onClose={handleEditModalClose} />
{/if}

{#if showDeleteModal && projectToDelete}
  <DeleteProjectModal
    project={$selectedProject}
    onClose={handleDeleteModalClose}
  />
{/if}

{#if $selectedCompany && $selectedCompany}
  <div class="flex justify-between">
    <ul class="flex space-x-2">
      {#if $companyProjects.length !== 0}
        <li>
          <span class="tooltip tooltip-bottom" data-tip="Projects">
            <span class="flex space-x-2">
              <label
                class="label icon {$selectedProject &&
                $selectedProject.name !== ''
                  ? 'text-accent'
                  : ''}"
                for="project-select"
              >
                <Folder size="16" />
              </label>
              <select
                id="project-select"
                class="select {$selectedProject && $selectedProject.name !== ''
                  ? 'select-accent'
                  : ''}"
                onchange={handleProjectSelect}
              >
                <option value="" selected={!$selectedProject}
                  >Select a project</option
                >
                {#each $companyProjects as project (project.name)}
                  <option
                    value={project.id}
                    selected={$selectedProject &&
                      $selectedProject.id === project.id}
                  >
                    {project.name}
                  </option>
                {/each}
              </select>
            </span>
          </span>
        </li>
      {/if}
      <li>
        <div class="tooltip tooltip-bottom" data-tip="Add Project">
          <button class="btn" onclick={handleAddProject}
            ><Plus size="16" /></button
          >
        </div>
      </li>
      {#if $selectedProject !== null && $selectedProject.id !== null}
        <li>
          <div class="tooltip tooltip-bottom" data-tip="Edit project">
            <button class="btn" onclick={handleEditClick}
              ><SquarePen size="16" /></button
            >
          </div>
        </li>
        <li>
          <div class="tooltip tooltip-bottom hover:btn-error" data-tip="Delete">
            <button class="btn" onclick={handleDeleteClick}
              ><Trash size="16" /></button
            >
          </div>
        </li>
      {/if}
    </ul>
  </div>
{/if}
