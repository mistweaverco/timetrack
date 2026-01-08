<script lang="ts">
  import { companies } from '../../stores'

  export let company: DBCompany
  export let onClose: (success: boolean, editedCompany?: DBCompany) => void

  let name = company.name
  let status = company.status || 'active'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editCompany({
        name,
        oldname: company.name,
        status,
      })

      if (result.success) {
        await companies.update(cs =>
          cs.map(c => (c.name === company.name ? { name, status } : c)),
        )
        onClose(true, { name, status })
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Company</h3>
    <form on:submit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Company Name</span>
        </label>
        <input
          type="text"
          bind:value={name}
          class="input input-bordered"
          required
        />
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
