<script lang="ts">
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
  import { CheckIcon, ChevronsUpDownIcon } from '@lucide/svelte'
  import { tick } from 'svelte'
  import { Button } from '@ui/button'
  import * as Command from '@ui/command'
  import * as Popover from '@ui/popover'
  import { cn } from '$lib/utils'

  let showEditModal = false
  let showDeleteModal = false
  let projectToEdit: DBProject | null = null
  let projectToDelete: DBProject | null = null

  let open = $state(false)
  let value = $state('')
  let triggerRef = $state<HTMLButtonElement>(null!)

  // We want to refocus the trigger button when the user selects
  // an item from the list so users can continue navigating the
  // rest of the form with the keyboard.
  function closeAndFocusTrigger() {
    open = false
    tick().then(() => {
      triggerRef.focus()
    })
  }

  const activeTasksList = $derived(activeTasks)
  const selectedProj = $derived(selectedProject)
  const selectedComp = $derived(selectedCompany)
  const companyProjects = $derived(projectsForSelectedCompany)

  const selectedValue = $derived(
    $companyProjects.find(p => p.id === value)?.name || null,
  )

  selectedCompany.subscribe(async value => {
    if (value.id) {
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

  function handleProjectSelect(project: DBProject) {
    selectedTask.set(null)
    selectedTaskDefinition.set(null)
    selectedProject.set({
      id: project.id,
      name: project.name,
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
        id: editedProject.id,
        name: editedProject.name,
      })
      fetchProjects($selectedCompany.id || undefined)
    }
    projectToEdit = null
  }

  function handleDeleteModalClose(success: boolean) {
    showDeleteModal = false
    if (success) {
      selectedProject.set({ id: null, name: null })
      fetchProjects($selectedCompany.id || undefined)
    }
    projectToDelete = null
  }

  function hasActiveTask(projectName: string): boolean {
    return $activeTasksList.some(at => at.projectName === projectName)
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

<Popover.Root bind:open>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class="w-50 justify-between"
        role="combobox"
        aria-expanded={open}
      >
        {selectedValue || 'Select a project...'}
        <ChevronsUpDownIcon class="opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-50 p-0">
    <Command.Root>
      <Command.Input placeholder="Search projects..." />
      <Command.List>
        <Command.Empty>No project found.</Command.Empty>
        <Command.Group value="projects">
          {#each $companyProjects as project (project.name)}
            <Command.Item
              value={project.id}
              onSelect={() => {
                value = project.id
                closeAndFocusTrigger()
              }}
            >
              <CheckIcon
                class={cn(value !== project.id && 'text-transparent')}
              />
              {project.name}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>

<section class="section">
  <h1 class="text-2xl font-bold">Projects</h1>
  <h2 class="text-lg text-base-content/70">
    Manage your projects for {selectedComp.name || 'the selected company'}.
    Select a project to view its tasks.
  </h2>

  {#if !$selectedComp.id}
    <InfoBox type="info" title="Select a Company">
      Please select a company first to view and manage its projects.
    </InfoBox>
  {:else}
    <div class="grid grid-cols-3 gap-4 mt-4">
      <!-- New Project -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">New</h2>
          <form onsubmit={handleAddProject}>
            <div class="form-control">
              <label class="label" for="name">
                <span class="label-text">Project Name</span>
              </label>
              <input
                id="name"
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
            {#each $companyProjects as project (project.name)}
              <button
                class="p-3 rounded cursor-pointer transition-colors w-full text-left border-2"
                class:bg-base-300={$selectedProj.id === project.id}
                class:text-neutral-content={$selectedProj.id === project.id}
                class:border-success={$selectedProj.id === project.id}
                class:border-base-100={$selectedProj.id !== project.id}
                onclick={() => handleProjectSelect(project)}
              >
                <p class="font-semibold">{project.name}</p>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Actions -->
      {#if $selectedProj.id}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Actions</h2>
            {#if hasActiveTask($selectedProj.name || '')}
              <InfoBox type="warning" title="Warning">
                A task belonging to this project is currently active, you need
                to stop it to perform any action.
              </InfoBox>
            {:else}
              <div class="flex gap-2">
                <button
                  class="btn btn-warning"
                  onclick={() => {
                    const proj = $projects.find(p => p.id === $selectedProj.id)
                    if (proj) handleEditClick(proj)
                  }}
                >
                  Edit
                </button>
                <button
                  class="btn btn-error"
                  onclick={() => {
                    const proj = $projects.find(p => p.id === $selectedProj.id)
                    if (proj) handleDeleteClick(proj)
                  }}
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
