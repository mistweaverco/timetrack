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

  const parseDateTime = (
    value?: string,
  ): { date: string; hour: number; minute: number } => {
    if (!value) return { date: '', hour: 0, minute: 0 }
    const v = value.trim()

    let datePart = ''
    let timePart = ''

    if (v.includes(' ')) {
      ;[datePart, timePart] = v.split(' ')
    } else if (v.includes('T')) {
      ;[datePart, timePart] = v.split('T')
    } else {
      datePart = v
      timePart = '00:00:00'
    }

    const [hh, mm] = timePart.split(':')
    return {
      date: datePart,
      hour: Number(hh) || 0,
      minute: Number(mm) || 0,
    }
  }

  const startParsed = parseDateTime(task.startDateTime)
  const endParsed = parseDateTime(task.endDateTime ?? task.startDateTime)

  let startDate = $state(startParsed.date)
  let startHour = $state(startParsed.hour)
  let startMinute = $state(startParsed.minute)

  let endDate = $state(endParsed.date)
  let endHour = $state(endParsed.hour)
  let endMinute = $state(endParsed.minute)

  let activeTask: ActiveTask | undefined
  let isActive = $state(false)

  const pad = (n: number): string => n.toString().padStart(2, '0')

  $effect(() => {
    activeTask = $activeTasks.find(at => at.taskId === task.id)
    isActive = activeTask !== undefined && activeTask.isActive
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!startDate || !endDate) {
      return
    }

    const startDateTime = `${startDate} ${pad(startHour)}:${pad(
      startMinute,
    )}:00`
    const endDateTime = `${endDate} ${pad(endHour)}:${pad(endMinute)}:00`

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
        <label class="label">
          <span class="label-text">Start time</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <input
            type="date"
            bind:value={startDate}
            class="input input-bordered"
            required
          />
          <input
            type="number"
            min="0"
            max="23"
            bind:value={startHour}
            class="input input-bordered"
            required
          />
          <input
            type="number"
            min="0"
            max="59"
            bind:value={startMinute}
            class="input input-bordered"
            required
          />
        </div>
      </div>
      <div class="form-control mt-4 {isActive ? 'hidden' : ''}">
        <label class="label">
          <span class="label-text">End time</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <input
            type="date"
            bind:value={endDate}
            class="input input-bordered"
            required
          />
          <input
            type="number"
            min="0"
            max="23"
            bind:value={endHour}
            class="input input-bordered"
            required
          />
          <input
            type="number"
            min="0"
            max="59"
            bind:value={endMinute}
            class="input input-bordered"
            required
          />
        </div>
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
