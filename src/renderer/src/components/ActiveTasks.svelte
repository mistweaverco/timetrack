<script lang="ts">
  import { onMount } from 'svelte'
  import { activeTasks, tasks as tasksStore, selectedProject } from '../stores'
  import TimerComponent from './TimerComponent.svelte'

  let tasks: ActiveTask[] = []

  onMount(async () => {
    await fetchActiveTasks()

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fetchActiveTasks()
      }
    })
  })

  activeTasks.subscribe(value => {
    tasks = value
  })

  async function fetchActiveTasks() {
    if (window.electron) {
      try {
        tasks = await window.electron.getActiveTasks()
        activeTasks.set(tasks)
      } catch (error) {
        console.error('Error loading active tasks:', error)
      }
    }
  }

  async function handleStartTask(task: ActiveTask) {
    if (window.electron) {
      const result = await window.electron.startActiveTask({
        taskId: task.taskId,
        description: task.description,
        date: task.date,
        seconds: task.seconds,
      })
      if (result.success) {
        await fetchActiveTasks()
      }
    }
  }

  async function handleStopTask(task: ActiveTask) {
    if (window.electron) {
      const result = await window.electron.stopActiveTask({
        taskId: task.taskId,
        date: task.date,
      })
      if (result.success) {
        await fetchActiveTasks()
        // Refresh tasks list to show updated time
        const selectedProj = $selectedProject
        if (selectedProj.id) {
          try {
            const updatedTasks = await window.electron.getTasksToday(
              selectedProj.id,
            )
            tasksStore.set(updatedTasks)
          } catch (error) {
            console.error('Error refreshing tasks after stop:', error)
          }
        }
      }
    }
  }

  async function handlePauseTask(task: ActiveTask) {
    if (window.electron) {
      const result = await window.electron.pauseActiveTask({
        taskId: task.taskId,
        date: task.date,
        seconds: task.seconds,
      })
      if (result.success) {
        await fetchActiveTasks()
      }
    }
  }
</script>

{#if tasks.length > 0}
  <section class="section">
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Active Tasks</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Task Name</th>
                <th>Task Elapsed</th>
                <th>Task Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each tasks as task (`${task.taskId}-${task.date}`)}
                <tr>
                  <td>{task.projectName || ''}</td>
                  <td>{task.name || ''}</td>
                  <td>
                    <TimerComponent {task} />
                  </td>
                  <td>{task.date}</td>
                  <td>
                    {#if task.isActive}
                      <button
                        class="btn btn-warning btn-sm mr-2"
                        on:click={() => handlePauseTask(task)}
                      >
                        Pause
                      </button>
                    {:else}
                      <button
                        class="btn btn-success btn-sm mr-2"
                        on:click={() => handleStartTask(task)}
                      >
                        Resume
                      </button>
                    {/if}
                    <button
                      class="btn btn-error btn-sm"
                      on:click={() => handleStopTask(task)}
                    >
                      Stop
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
{/if}
