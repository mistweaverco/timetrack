<script lang="ts">
  import { activeTasks, tasks } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  export let task: DBTask
  export let onClose: (success: boolean, editedTask?: DBTask) => void

  let description = task.description
  let hours = Math.floor(task.seconds / 3600)
  let minutes = Math.floor((task.seconds % 3600) / 60)
  let seconds = task.seconds % 60
  let date = task.date
  let status = task.status || 'active'
  const oldDate = task.date

  $: activeTask = $activeTasks.find(
    at =>
      at.name === task.name &&
      at.project_name === task.project_name &&
      at.date === oldDate,
  )

  $: isActive = activeTask !== undefined && activeTask.isActive
  $: currentSeconds = hours * 3600 + minutes * 60 + seconds

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editTask({
        name: task.name,
        description,
        project_name: task.project_name,
        seconds: currentSeconds,
        date: date,
        old_date: oldDate,
        status,
      })

      if (result.success) {
        // Update active tasks if task is active
        if (activeTask) {
          await activeTasks.update(ats =>
            ats.map(at =>
              at.name === task.name &&
              at.project_name === task.project_name &&
              at.date === oldDate
                ? { ...at, description, seconds: currentSeconds, date: date }
                : at,
            ),
          )
        }

        // Pass edited task back to parent - parent will refresh from database
        onClose(true, {
          ...task,
          description,
          seconds: currentSeconds,
          date: date,
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
    <h3 class="font-bold text-lg">Edit Task</h3>
    <form on:submit={handleSubmit}>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Task Description</span>
        </label>
        <textarea
          bind:value={description}
          class="textarea textarea-bordered"
          placeholder="Task Description"
        ></textarea>
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Task Date</span>
        </label>
        {#if isActive}
          <InfoBox type="warning" title="Warning">
            Editing the <strong>date</strong> of an
            <strong>active task</strong> is not allowed. You can stop the task first,
            and then edit the date.
          </InfoBox>
        {/if}
        <input
          type="date"
          bind:value={date}
          class="input input-bordered"
          disabled={isActive}
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Task Duration</span>
        </label>
        {#if isActive}
          <InfoBox type="warning" title="Warning">
            Editing the <strong>duration</strong> of an
            <strong>active task</strong> is not allowed. You can stop the task first,
            and then edit the duration.
          </InfoBox>
        {/if}
        <div class="grid grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Hours</span>
            </label>
            <input
              type="number"
              bind:value={hours}
              min="0"
              class="input input-bordered"
              disabled={isActive}
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Minutes</span>
            </label>
            <input
              type="number"
              bind:value={minutes}
              min="0"
              max="59"
              class="input input-bordered"
              disabled={isActive}
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Seconds</span>
            </label>
            <input
              type="number"
              bind:value={seconds}
              min="0"
              max="59"
              class="input input-bordered"
              disabled={isActive}
            />
          </div>
        </div>
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
        <button type="submit" class="btn btn-warning" disabled={isActive}
          >Edit</button
        >
        <button type="button" class="btn" on:click={handleCancel}>Cancel</button
        >
      </div>
    </form>
  </div>
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
