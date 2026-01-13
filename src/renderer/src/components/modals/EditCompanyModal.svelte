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
        id: company.id,
        name,
        status,
      })

      if (result.success) {
        companies.update(cs =>
          cs.map(c => (c.id === company.id ? { ...c, name, status } : c)),
        )
        onClose(true, { id: company.id, name, status })
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
        <label class="label" for="name">
          <span class="label-text">Company Name</span>
        </label>
        <input
          id="name"
          type="text"
          bind:value={name}
          class="input input-bordered"
          required
        />
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
