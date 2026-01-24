<script lang="ts">
  import { onMount } from 'svelte'
  import { selectedCompany } from '../../stores'

  let { onClose, onSuccess } = $props<{
    onSuccess: () => void
    onClose: () => void
  }>()

  let companyName = $state('')
  let companyNameInput: HTMLInputElement

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (companyName.trim() === '') {
      return
    }

    const result = await window.electron.addCompany(companyName)
    if (result.success) {
      onSuccess()
      companyName = ''
      selectedCompany.set(result.company)
    }
  }
  function handleCancel() {
    onClose()
  }
  onMount(() => {
    companyNameInput.focus()
  })
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Add company</h3>
    <form onsubmit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label" for="companyName">
          <span class="label-text">Company name</span>
        </label>
        <input
          id="companyName"
          bind:this={companyNameInput}
          type="text"
          bind:value={companyName}
          class="input input-bordered"
          required
        />
      </div>
      <div class="modal-action">
        <button type="submit" class="btn btn-success">Add</button>
        <button type="button" class="btn" onclick={handleCancel}>Cancel</button>
      </div>
    </form>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && handleCancel()}
    role="button"
    tabindex="0"
  ></div>
</div>
