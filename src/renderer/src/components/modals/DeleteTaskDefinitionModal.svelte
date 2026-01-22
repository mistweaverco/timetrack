<script lang="ts">
  let { onClose, onSuccess, taskDefinition } = $props<{
    taskDefinition: DBTaskDefinition
    onSuccess: () => void
    onClose: () => void
  }>()
  import {
    taskDefinitions,
    tasks,
    selectedTask,
    selectedTaskDefinition,
  } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  async function handleConfirm() {
    const result = await window.electron.deleteTaskDefinition({
      id: taskDefinition.id,
    })
    if (result.success) {
      // Update stores
      taskDefinitions.update(tds =>
        tds.filter(td => td.id !== taskDefinition.id),
      )

      // Remove tasks that belong to this task definition
      tasks.update(ts =>
        ts.filter(t => t.taskDefinitionId !== taskDefinition.id),
      )

      selectedTask.set(null)
      selectedTaskDefinition.set(null)
      onSuccess()
    }
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Task Definition</h3>
    <InfoBox type="error" title="Warning">
      <p>Deleting a task definition is a hazardous action.</p>
      <p>If you delete a task definition, it'll also delete all its tasks.</p>
      <p>Maybe consider marking it as inactive?</p>
    </InfoBox>
    <p class="mt-4">Are you sure you want to delete this task definition?</p>
    <div class="modal-action">
      <button class="btn btn-error" onclick={handleConfirm}>Yes</button>
      <button class="btn btn-primary" onclick={onClose}>No</button>
    </div>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
  ></div>
</div>
