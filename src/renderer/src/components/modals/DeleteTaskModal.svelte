<script lang="ts">
  import { tasks, selectedTask } from '../../stores'

  // Optional task passed in by caller; falls back to selectedTask store.
  export let task: DBTask | null = null
  export let onSuccess: (deletedTaskId?: string) => void
  export let onClose: () => void

  async function handleConfirm() {
    const currentTaskId = task?.id ?? $selectedTask?.id
    if (!currentTaskId) {
      onClose()
      return
    }

    const result = await window.electron.deleteTask({
      id: currentTaskId,
    })

    if (result.success) {
      // Update main-view tasks store; harmless no-op for Search view
      tasks.update(ts => ts.filter(t => t.id !== currentTaskId))

      // Clear selectedTask only when we were using the global selection
      if (!task) {
        selectedTask.set(null)
      }

      onSuccess(currentTaskId)
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
    role="button"
    tabindex="0"
  ></div>
</div>
