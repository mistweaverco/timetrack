<script lang="ts">
  let { onClose, onSuccess, company } = $props<{
    company: DBCompany
    onClose: () => void
    onSuccess: (company: DBCompany) => void
  }>()
  import { companies } from '../../stores'

  let name = $derived(company.name)
  let status = $derived(company.status || 'active')

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
        onSuccess({ id: company.id, name, status })
      }
    }
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Company: {company.name}</h3>
    <form onsubmit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label" for="companyName">
          <span class="label-text">Name</span>
        </label>
        <input
          id="companyName"
          type="text"
          bind:value={name}
          class="input input-bordered"
          required
        />
      </div>
      <label class="label mt-4" for="status">
        <span class="label-text">Status</span>
        <span
          class="tooltip tooltip-right"
          data-tip="Inactive companies are hidden from selection. Like archived."
        >
          *</span
        >
      </label>
      <div class="form-control">
        <select bind:value={status} class="select w-auto" required id="status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-action">
        <button type="submit" class="btn btn-success">Add</button>
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
