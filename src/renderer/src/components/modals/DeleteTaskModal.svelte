<script lang="ts">
  import { tasks, selectedTask } from '../../stores'

  export let task: DBTask
  export let onClose: (success: boolean) => void

  async function handleConfirm() {
    if (window.electron) {
      const result = await window.electron.deleteTask({
        name: task.name,
        project_name: task.project_name,
        date: task.date,
      })
      if (result.success) {
        await tasks.update(ts =>
          ts.filter(
            t =>
              !(
                t.name === task.name &&
                t.project_name === task.project_name &&
                t.date === task.date
              ),
          ),
        )
        if (
          $selectedTask?.name === task.name &&
          $selectedTask?.project_name === task.project_name &&
          $selectedTask?.date === task.date
        ) {
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
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
