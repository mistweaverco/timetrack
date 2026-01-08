<script lang="ts">
  import {
    taskDefinitions,
    tasks,
    selectedTask,
    selectedTaskDefinition,
  } from '../../stores'

  export let taskDefinition: DBTaskDefinition
  export let onClose: (
    success: boolean,
    editedTaskDefinition?: DBTaskDefinition,
  ) => void

  let taskDefName = taskDefinition.name
  let status = taskDefinition.status || 'active'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      // Fetch tasks using this task definition
      const rpcTasks = await window.electron.getTasksByNameAndProject({
        name: taskDefinition.name,
        project_name: taskDefinition.project_name,
      })

      const result = await window.electron.editTaskDefinition({
        oldname: taskDefinition.name,
        name: taskDefName,
        project_name: taskDefinition.project_name,
        status,
      })

      if (result.success) {
        // Update stores
        await taskDefinitions.update(tds =>
          tds.map(td =>
            td.name === taskDefinition.name &&
            td.project_name === taskDefinition.project_name
              ? {
                  name: taskDefName,
                  project_name: taskDefinition.project_name,
                  status,
                }
              : td,
          ),
        )

        // Update tasks with new name
        await tasks.update(ts =>
          ts.map(t =>
            t.name === taskDefinition.name &&
            t.project_name === taskDefinition.project_name
              ? { ...t, name: taskDefName }
              : t,
          ),
        )

        selectedTask.set(null)
        selectedTaskDefinition.set(null)
        onClose(true, {
          name: taskDefName,
          project_name: taskDefinition.project_name,
          status,
        })
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Task Definition</h3>
    <form on:submit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Task Definition Name</span>
        </label>
        <input
          type="text"
          bind:value={taskDefName}
          class="input input-bordered"
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Status</span>
        </label>
        <select bind:value={status} class="select select-bordered" required>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-action">
        <button type="submit" class="btn btn-warning">Edit</button>
        <button type="button" class="btn" on:click={handleCancel}>Cancel</button
        >
      </div>
    </form>
  </div>
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
