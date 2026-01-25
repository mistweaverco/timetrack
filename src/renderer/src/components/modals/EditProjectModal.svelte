<script lang="ts">
  let { onClose, onSuccess, project } = $props<{
    project: DBProject
    onSuccess: (dbProject: DBProject) => void
    onClose: () => void
  }>()
  import {
    projects,
    companies,
    selectedProject,
    selectedCompany,
    selectedTaskDefinition,
  } from '../../stores'

  let projectName = $derived(project && project.name)
  let companyId = $derived(project && project.companyId)
  let status = $derived((project && project.status) || 'active')
  let existingProject: DBProject | null = $state(null)

  const mergeProjects = async (evt: Event) => {
    evt.preventDefault()
    if (existingProject) {
      await window.electron.mergeProjects(project.id, existingProject.id)
      existingProject.name = projectName
      existingProject.status = status
      project.id = existingProject.id
      companyId = existingProject.companyId
      status = existingProject.status
      $selectedCompany = $companies.find(c => c.id === companyId) || null
      $selectedProject = existingProject
      $selectedTaskDefinition = null
      await editProject()
      projects.update(ps => ps.filter(p => p.id !== project.id))
      onSuccess(existingProject)
    }
  }

  const editProject = async () => {
    const result = await window.electron.editProject({
      id: project.id,
      name: projectName,
      companyId,
      status,
    })
    if (result.success) {
      projects.update(ps =>
        ps.map(p =>
          p.id === project.id
            ? { ...p, name: projectName, companyId, status }
            : p,
        ),
      )
      selectedProject.update(p =>
        p && p.id === project.id
          ? { ...p, name: projectName, companyId, status }
          : p,
      )
      if (status === 'inactive') {
        selectedProject.set(null)
        await onSuccess(null)
        return
      }
      onSuccess({ id: project.id, name: projectName, companyId, status })
    }
  }

  const checkProjectNameExists = async () => {
    if (projectName === project.name && companyId === project.companyId) {
      return false
    }
    existingProject = await window.electron.getProjectByName(
      projectName,
      companyId,
    )
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    await checkProjectNameExists()
    if (!existingProject) {
      await editProject()
    }
  }
</script>

<div class="modal {existingProject ? 'modal-open' : ''}">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Migrate project?</h3>
    <p class="py-4">A project with this name already exists.</p>
    <p class="py-2">
      Do you want to migrate everything to the existing project and apply your
      changes there?
    </p>
    <div class="modal-action">
      <button type="submit" class="btn btn-warning" onclick={mergeProjects}
        >Yes</button
      >
      <button type="button" class="btn" onclick={onClose}>Cancel</button>
    </div>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
  ></div>
</div>

<div class="modal {!existingProject ? 'modal-open' : ''}">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Project</h3>
    <form onsubmit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label" for="projectName">
          <span class="label-text">Project Name</span>
        </label>
        <input
          id="projectName"
          type="text"
          bind:value={projectName}
          class="input input-bordered"
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label" for="companyId">
          <span class="label-text">Company</span>
        </label>
        <select
          id="companyId"
          bind:value={companyId}
          class="select select-bordered"
          required
        >
          {#each $companies as comp (comp.id)}
            <option value={comp.id}>{comp.name}</option>
          {/each}
        </select>
      </div>
      <div class="form-control mt-4">
        <label class="label" for="status">
          <span class="label-text">Status</span>
        </label>
        <select
          bind:value={status}
          class="select select-bordered"
          required
          id="status"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-action">
        <button type="submit" class="btn btn-warning">Edit</button>
        <button type="button" class="btn" onclick={onClose}>Cancel</button>
      </div>
    </form>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
  ></div>
</div>
