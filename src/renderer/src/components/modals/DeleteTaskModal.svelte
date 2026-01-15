<script lang="ts">
  import { tasks, selectedTask } from '../../stores'

  export let onSuccess: () => void
  export let onClose: () => void

  async function handleConfirm() {
    const result = await window.electron.deleteTask({
      id: $selectedTask.id,
    })
    if (result.success) {
      tasks.update(ts => ts.filter(t => t.id !== $selectedTask.id))
      selectedTask.set(null)
      onSuccess()
    }
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Task</h3>
    <p>Are you sure you want to delete this task?</p>
    <div class="modal-action">
      <button class="btn btn-error" on:click={handleConfirm}>Yes</button>
      <button class="btn btn-primary" on:click={onClose}>No</button>
    </div>
  </div>
  <div
    class="modal-backdrop"
    on:keypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    on:click={onClose}
    role="button"
    tabindex="0"
  ></div>
</div>
