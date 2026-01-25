<script lang="ts">
  let { onClose, onSuccess, project } = $props<{
    project: DBProject
    onSuccess: (dbProject: DBProject) => void
    onClose: () => void
  }>()
  import { projects, companies, selectedProject } from '../../stores'

  let projectName = $derived(project && project.name)
  let companyId = $derived(project && project.companyId)
  let status = $derived((project && project.status) || 'active')

  async function handleSubmit(e: Event) {
    e.preventDefault()
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
</script>

<div class="modal modal-open">
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
