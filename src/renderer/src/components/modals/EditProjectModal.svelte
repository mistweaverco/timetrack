<script lang="ts">
  import { projects, companies } from '../../stores'

  export let project: DBProject
  export let onClose: (success: boolean, editedProject?: DBProject) => void

  let projectName = project.name
  let companyId = project.companyId
  let status = project.status || 'active'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
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
        onClose(true, { ...project, name: projectName, companyId, status })
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Project</h3>
    <form on:submit={handleSubmit}>
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
        <button type="button" class="btn" on:click={handleCancel}>Cancel</button
        >
      </div>
    </form>
  </div>
  <div
    class="modal-backdrop"
    on:keypress={(evt: KeyboardEvent) => evt.key === 'Escape' && handleCancel()}
    on:click={handleCancel}
    role="button"
    tabindex="0"
  ></div>
</div>
