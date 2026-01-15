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
      const result = await window.electron.editTaskDefinition({
        id: taskDefinition.id,
        name: taskDefName,
        status,
      })

      if (result.success) {
        // Update stores
        taskDefinitions.update(tds =>
          tds.map(td =>
            td.id === taskDefinition.id
              ? { ...td, name: taskDefName, status }
              : td,
          ),
        )

        selectedTask.set(null)
        selectedTaskDefinition.set(null)
        onClose(true, {
          ...taskDefinition,
          name: taskDefName,
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
        <label class="label" for="taskDefName">
          <span class="label-text">Task Definition Name</span>
        </label>
        <input
          id="taskDefName"
          type="text"
          bind:value={taskDefName}
          class="input input-bordered"
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label" for="status">
          <span class="label-text">Status</span>
        </label>
        <select
          bind:value={status}
          class="select select-bordered"
          required
          id="status"
        >
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
  <div
    class="modal-backdrop"
    on:keypress={(evt: KeyboardEvent) => evt.key === 'Escape' && handleCancel()}
    on:click={handleCancel}
    role="button"
    tabindex="0"
  ></div>
</div>
