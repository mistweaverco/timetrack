<script lang="ts">
  import { onMount } from 'svelte'

  let { onClose, onSuccess, project } = $props<{
    project: DBProject
    onClose: () => void
    onSuccess: () => void
  }>()

  let taskDefinitionName = $state('')
  let taskDefinitionNameInput: HTMLInputElement

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (taskDefinitionName.trim() === '') {
      return
    }

    const result = await window.electron.addTaskDefinition({
      projectId: project.id,
      name: taskDefinitionName.trim(),
    })
    if (result.success) {
      onSuccess()
      taskDefinitionName = ''
    }
  }
  onMount(() => {
    taskDefinitionNameInput.focus()
  })
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Add new task</h3>
    <form onsubmit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label" for="taskName">
          <span class="label-text">Task name</span>
        </label>
        <input
          id="taskName"
          bind:this={taskDefinitionNameInput}
          type="text"
          bind:value={taskDefinitionName}
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
