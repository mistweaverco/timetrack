<script lang="ts">
  import { onMount } from 'svelte'

  let { onClose, onSuccess, company } = $props<{
    company: DBCompany
    onSuccess: () => void
    onClose: () => void
  }>()

  let projectName = $state('')
  let projectNameInput: HTMLInputElement

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (projectName.trim() === '') {
      return
    }

    const result = await window.electron.addProject(
      projectName.trim(),
      company.id,
    )
    if (result.success) {
      onSuccess()
      projectName = ''
    }
  }
  onMount(() => {
    projectNameInput.focus()
  })
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Add project</h3>
    <form onsubmit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label" for="projectName">
          <span class="label-text">Name</span>
        </label>
        <input
          id="projectName"
          bind:this={projectNameInput}
          type="text"
          bind:value={projectName}
          class="input input-bordered"
          required
        />
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
