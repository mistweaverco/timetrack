<script lang="ts">
  import { activeTasks } from '../../stores'
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
    at => at.taskId === task.id && at.date === oldDate,
  )

  $: isActive = activeTask !== undefined && activeTask.isActive
  $: currentSeconds = hours * 3600 + minutes * 60 + seconds

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editTask({
        id: task.id,
        taskDefinitionId: task.taskDefinitionId,
        description,
        seconds: currentSeconds,
        date: date,
        oldDate: oldDate,
        status,
      })

      if (result.success) {
        // Update active tasks if task is active
        if (activeTask) {
          activeTasks.update(ats =>
            ats.map(at =>
              at.taskId === task.id && at.date === oldDate
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
        <label class="label" for="description">
          <span class="label-text">Task Description</span>
        </label>
        <textarea
          id="description"
          bind:value={description}
          class="textarea textarea-bordered"
          placeholder="Task Description"
        ></textarea>
      </div>
      <div class="form-control mt-4">
        <label class="label" for="date">
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
          id="date"
          type="date"
          bind:value={date}
          class="input input-bordered"
          disabled={isActive}
          required
        />
      </div>
      <div class="form-control mt-4">
        <label class="label" for="duration">
          <span class="label-text">Task Duration</span>
        </label>
        {#if isActive}
          <InfoBox type="warning" title="Warning">
            Editing the <strong>duration</strong> of an
            <strong>active task</strong> is not allowed. You can stop the task first,
            and then edit the duration.
          </InfoBox>
        {/if}
        <div class="grid grid-cols-3 gap-4" id="duration">
          <div class="form-control">
            <label class="label" for="hours">
              <span class="label-text">Hours</span>
            </label>
            <input
              id="hours"
              type="number"
              bind:value={hours}
              min="0"
              class="input input-bordered"
              disabled={isActive}
            />
          </div>
          <div class="form-control">
            <label class="label" for="minutes">
              <span class="label-text">Minutes</span>
            </label>
            <input
              id="minutes"
              type="number"
              bind:value={minutes}
              min="0"
              max="59"
              class="input input-bordered"
              disabled={isActive}
            />
          </div>
          <div class="form-control">
            <label class="label" for="seconds">
              <span class="label-text">Seconds</span>
            </label>
            <input
              id="seconds"
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
        <button type="submit" class="btn btn-warning" disabled={isActive}
          >Edit</button
        >
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
