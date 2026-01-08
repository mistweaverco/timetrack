<script lang="ts">
  import { projects, companies } from '../../stores'

  export let project: DBProject
  export let onClose: (success: boolean, editedProject?: DBProject) => void

  let projectName = project.name
  let companyName = project.company_name
  let status = project.status || 'active'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editProject({
        oldname: project.name,
        name: projectName,
        company_name: companyName,
        status,
      })
      if (result.success) {
        await projects.update(ps =>
          ps.map(p =>
            p.name === project.name
              ? { name: projectName, company_name: companyName, status }
              : p,
          ),
        )
        onClose(true, { name: projectName, company_name: companyName, status })
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
        <label class="label">
          <span class="label-text">Project Name</span>
        </label>
        <input
          type="text"
          bind:value={projectName}
          class="input input-bordered"
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Company</span>
        </label>
        <select
          bind:value={companyName}
          class="select select-bordered"
          required
        >
          {#each $companies as company}
            <option value={company.name}>{company.name}</option>
          {/each}
        </select>
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Status</span>
        </label>
        <select bind:value={status} class="select select-bordered" required>
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
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
