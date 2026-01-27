<script lang="ts">
  import { onMount } from 'svelte'
  import {
    activeTasks,
    tasks as tasksStore,
    selectedProject,
    selectedTask,
  } from '../stores'
  import TimerComponent from './TimerComponent.svelte'
  import { CheckCheck, Pause, Play } from '@lucide/svelte'

  let tasks: ActiveTask[] = []

  onMount(async () => {
    await fetchActiveTasks()

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fetchActiveTasks()
      }
    })

    // Listen for window restore event from main process
    window.electron.on('window-restored', () => {
      fetchActiveTasks()
    })
  })

  activeTasks.subscribe(value => {
    tasks = value
  })

  async function fetchActiveTasks() {
    try {
      tasks = await window.electron.getActiveTasks()
      activeTasks.set(tasks)
    } catch (error) {
      console.error('Error loading active tasks:', error)
    }
  }

  async function handleStartTask(taskId: string) {
    const result = await window.electron.startActiveTask(taskId)
    if (result.success) {
      await fetchActiveTasks()
    }
  }

  async function handleStopTask(taskId: string) {
    const result = await window.electron.stopActiveTask(taskId)
    if (result.success) {
      await fetchActiveTasks()
      // Refresh tasks list to show updated time
      if ($selectedProject && $selectedProject.id) {
        try {
          const updatedTasks = await window.electron.getTasksToday(
            $selectedProject.id,
          )
          tasksStore.set(updatedTasks)
        } catch (error) {
          console.error('Error refreshing tasks after stop:', error)
        }
      }
      if ($selectedTask && $selectedTask.id === taskId) {
        const updatedTask = await window.electron.getTaskById(taskId)
        selectedTask.set(updatedTask)
      }
    }
  }

  async function handlePauseTask(taskId: string) {
    const result = await window.electron.pauseActiveTask(taskId)
    if (result.success) {
      await fetchActiveTasks()
    }
  }
</script>

{#if tasks.length > 0}
  <section class="section">
    <div class="card bg-base-200 outline outline-accent">
      <div class="card-body">
        <h2 class="card-title">Active Tasks</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Elapsed</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each tasks as task (task.taskId)}
                <tr class="hover:bg-base-100">
                  <td>{task.companyName} > {task.projectName} > {task.name}</td>
                  <td>
                    <TimerComponent {task} />
                  </td>
                  <td>{task.date}</td>
                  <td>
                    {#if task.isActive}
                      <span class="tooltip" data-tip="Pause">
                        <button
                          class="btn btn-warning btn-soft btn-circle"
                          on:click={() => handlePauseTask(task.taskId)}
                        >
                          <Pause size="16" />
                        </button>
                      </span>
                    {:else}
                      <span class="tooltip" data-tip="Resume">
                        <button
                          class="btn btn-success btn-soft btn-circle"
                          on:click={() => handleStartTask(task.taskId)}
                        >
                          <Play size="16" />
                        </button>
                      </span>
                    {/if}
                    <span class="tooltip" data-tip="Done">
                      <button
                        class="btn btn-success btn-soft btn-circle"
                        on:click={() => handleStopTask(task.taskId)}
                      >
                        <CheckCheck size="16" />
                      </button>
                    </span>
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
