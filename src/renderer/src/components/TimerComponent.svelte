<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { getHMSStringFromSeconds } from '../lib/utils'
  import { activeTasks } from '../stores'

  export let task: DBTask | ActiveTask

  let displayTime = getHMSStringFromSeconds(task.seconds)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let localSeconds = task.seconds

  $: isActive = 'isActive' in task && task.isActive
  $: currentSeconds = task.seconds

  // Update local seconds when task seconds change (but not when active, to avoid resetting during count)
  $: if (!isActive && currentSeconds !== undefined) {
    localSeconds = currentSeconds
    displayTime = getHMSStringFromSeconds(localSeconds)
  }

  // Start/stop interval based on isActive
  $: {
    if (isActive) {
      // Start interval if not already running
      if (!intervalId) {
        localSeconds = currentSeconds
        intervalId = setInterval(() => {
          localSeconds++
          displayTime = getHMSStringFromSeconds(localSeconds)
          // Update the active task in store
          activeTasks.update(tasks =>
            tasks.map(t =>
              t.name === task.name &&
              t.project_name === task.project_name &&
              t.date === task.date
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
        displayTime = getHMSStringFromSeconds(localSeconds)
      }
    }
  }

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
</script>

<div>{displayTime}</div>
