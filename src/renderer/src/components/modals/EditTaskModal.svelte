<script lang="ts">
  let { onClose, onSuccess, task } = $props<{
    task: DBTask
    onClose: () => void
    onSuccess: (editedTask: DBTask) => void
  }>()

  import { activeTasks } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  let description = $derived(task.description)
  let status = $derived(task.status)

  // Convert stored SQLite DATETIME to datetime-local input value (to minutes)
  const toLocalInputValue = (value?: string): string => {
    if (!value) return ''
    const v = value.trim()

    // Stored format is "YYYY-MM-DD HH:MM:SS" – convert to "YYYY-MM-DDTHH:MM"
    if (v.includes(' ')) {
      const [datePart, timePart] = v.split(' ')
      const [hh, mm] = timePart.split(':')
      return `${datePart}T${hh}:${mm}`
    }

    // If only a date is stored, default to midnight
    if (v.length === 10) {
      return `${v}T00:00`
    }

    return ''
  }

  const fromLocalInputValue = (v: string): string => {
    // Convert "YYYY-MM-DDTHH:MM" to "YYYY-MM-DD HH:MM:SS"
    if (!v) return ''
    const [datePart, timePart] = v.split('T')
    if (!timePart) return `${datePart} 00:00:00`
    const [hh, mm] = timePart.split(':')
    return `${datePart} ${hh}:${mm}:00`
  }

  let startLocal = $state(toLocalInputValue(task.startDateTime))
  let endLocal = $state(
    toLocalInputValue(task.endDateTime ?? task.startDateTime),
  )

  let activeTask: ActiveTask | undefined
  let isActive = $state(false)

  $effect(() => {
    activeTask = $activeTasks.find(at => at.taskId === task.id)
    isActive = activeTask !== undefined && activeTask.isActive
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!startLocal || !endLocal) {
      return
    }

    const startDateTime = fromLocalInputValue(startLocal)
    const endDateTime = fromLocalInputValue(endLocal)

    const result = await window.electron.editTask({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description,
      startDateTime,
      endDateTime,
      status,
    })

    if (result.success) {
      // Pass edited task back to parent - parent will refresh from database
      onSuccess({
        ...task,
        description,
        startDateTime,
        endDateTime,
        status,
      })
    }
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Edit Task: {task.name}</h3>
    <form onsubmit={handleSubmit}>
      <label class="label mt-4" for="description">
        <span class="label-text">Task Description</span>
        <span class="tooltip" data-tip="Optional, markdown supported"> *</span>
      </label>
      <div class="form-control">
        <textarea
          id="description"
          bind:value={description}
          class="textarea w-full"
          rows="5"
          placeholder="Task Description"
        ></textarea>
      </div>
      <div class="form-control mt-4 {isActive ? 'hidden' : ''}">
        <label class="label" for="date">
          <span class="label-text">Start time</span>
        </label>
        <input
          id="date"
          type="datetime-local"
          bind:value={startLocal}
          class="input input-bordered"
          disabled={isActive}
          required
        />
      </div>
      <div class="form-control mt-4 {isActive ? 'hidden' : ''}">
        <label class="label" for="end">
          <span class="label-text">End time</span>
        </label>
        <input
          id="end"
          type="datetime-local"
          bind:value={endLocal}
          class="input input-bordered"
          disabled={isActive}
          required
        />
      </div>
      <label class="label mt-4" for="status">
        <span class="label-text">Status</span>
        <span
          class="tooltip tooltip-right"
          data-tip="Inactive tasks are hidden from selection. Like archived."
        >
          *</span
        >
      </label>
      <div class="form-control">
        <select bind:value={status} class="select w-auto" required id="status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-action">
        <button type="submit" class="btn btn-warning">Edit</button>
        <button type="button" class="btn" onclick={onClose}>Cancel</button>
      </div>
    </form>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
  ></div>
</div>
