<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import { getHMSStringFromSeconds } from '../lib/utils'
  import { activeTasks } from '../stores'

  let { task } = $props<{ task: DBTask | ActiveTask }>()

  // Use non-reactive variable for interval ID to avoid effect loops
  let intervalId: ReturnType<typeof setInterval> | null = null
  let localSeconds = $state(task.seconds)

  let isActive = $derived('isActive' in task && task.isActive)
  let currentSeconds = $derived(task.seconds)
  let displayTime = $derived(getHMSStringFromSeconds(localSeconds))

  // Update local seconds when task seconds change
  // For inactive tasks, always sync
  // For active tasks, sync if there's a significant difference (more than 2 seconds)
  // This handles the case when window was restored from tray and backend has correct time
  $effect(() => {
    if (currentSeconds !== undefined) {
      if (!isActive) {
        localSeconds = currentSeconds
      } else {
        // Check intervalId without tracking it as a dependency
        const currentInterval = untrack(() => intervalId)
        if (currentInterval && Math.abs(currentSeconds - localSeconds) > 2) {
          // Significant difference detected - sync with backend time
          localSeconds = currentSeconds
        }
      }
    }
  })

  // Start/stop interval based on isActive
  $effect(() => {
    if (isActive) {
      // Start interval if not already running
      if (!intervalId) {
        localSeconds = currentSeconds
        intervalId = setInterval(() => {
          localSeconds++
          // Update the active task in store
          activeTasks.update(tasks =>
            tasks.map(t =>
              ('taskId' in task && t.taskId === task.taskId) ||
              ('id' in task && t.taskId === task.id)
                ? { ...t, seconds: localSeconds }
                : t,
            ),
          )
        }, 1000)
      }
    } else {
      // Stop interval if running
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Cleanup: clear interval when isActive becomes false or component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  })

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
</script>

<div>{displayTime}</div>
