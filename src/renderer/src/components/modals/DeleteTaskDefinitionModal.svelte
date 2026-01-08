<script lang="ts">
  import {
    taskDefinitions,
    tasks,
    selectedTask,
    selectedTaskDefinition,
    selectedProject,
  } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  export let taskDefinition: DBTaskDefinition
  export let onClose: (success: boolean) => void

  async function handleConfirm() {
    if (window.electron) {
      // Fetch tasks using this task definition
      const rpcTasks = await window.electron.getTasksByNameAndProject({
        name: taskDefinition.name,
        project_name: taskDefinition.project_name,
      })

      const result = await window.electron.deleteTaskDefinition(taskDefinition)
      if (result.success) {
        // Update stores
        await taskDefinitions.update(tds =>
          tds.filter(
            td =>
              !(
                td.name === taskDefinition.name &&
                td.project_name === taskDefinition.project_name
              ),
          ),
        )

        // Remove tasks
        await tasks.update(ts =>
          ts.filter(
            t =>
              !(
                t.name === taskDefinition.name &&
                t.project_name === taskDefinition.project_name
              ),
          ),
        )

        selectedTask.set(null)
        selectedTaskDefinition.set(null)
        if ($selectedProject.name === taskDefinition.project_name) {
          selectedProject.set({ name: null })
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
    <h3 class="font-bold text-lg">Delete Task Definition</h3>
    <InfoBox type="error" title="Warning">
      <p>Deleting a task definition is a hazardous action.</p>
      <p>If you delete a task definition, it'll also delete all its tasks.</p>
      <p>Maybe consider marking it as inactive?</p>
    </InfoBox>
    <p class="mt-4">Are you sure you want to delete this task definition?</p>
    <div class="modal-action">
      <button class="btn btn-error" on:click={handleConfirm}>Yes</button>
      <button class="btn btn-primary" on:click={handleCancel}>No</button>
    </div>
  </div>
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
