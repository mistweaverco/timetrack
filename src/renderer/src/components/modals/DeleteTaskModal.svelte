<script lang="ts">
  import { tasks, selectedTask } from '../../stores'

  export let task: DBTask
  export let onClose: (success: boolean) => void

  async function handleConfirm() {
    if (window.electron) {
      const result = await window.electron.deleteTask({
        id: task.id,
      })
      if (result.success) {
        tasks.update(ts => ts.filter(t => t.id !== task.id))
        if ($selectedTask?.id === task.id) {
          selectedTask.set(null)
        }
        onClose(true)
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Task</h3>
    <p>Are you sure you want to delete this task?</p>
    <div class="modal-action">
      <button class="btn btn-error" on:click={handleConfirm}>Yes</button>
      <button class="btn btn-primary" on:click={handleCancel}>No</button>
    </div>
  </div>
  <div
    class="modal-backdrop"
    on:keypress={(evt: KeyboardEvent) => evt.key === 'Escape' && handleCancel()}
    on:click={handleCancel}
    role="button"
    tabindex="0"
  ></div>
</div>
