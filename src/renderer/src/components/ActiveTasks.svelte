<script lang="ts">
  import { onMount } from 'svelte'
  import {
    activeTasks,
    tasks as tasksStore,
    selectedProject,
    selectedTask,
  } from '../stores'
  import TimerComponent from './TimerComponent.svelte'
  import EditTaskModal from './modals/EditTaskModal.svelte'
  import { CheckCheck, SquarePen } from '@lucide/svelte'
  let showEditTaskModal = $state(false)
  let taskToEdit: DBTask | null = $state(null)

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

  async function fetchActiveTasks() {
    try {
      const tasks = await window.electron.getActiveTasks()
      activeTasks.set(tasks)
    } catch (error) {
      console.error('Error loading active tasks:', error)
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

  async function handleEditTask(taskId: string) {
    if (!window.electron) return
    const task = await window.electron.getTaskById(taskId)
    if (!task) return
    taskToEdit = task
    showEditTaskModal = true
  }

  async function handleEditModalClose(editedTask: DBTask | null) {
    showEditTaskModal = false
    taskToEdit = null

    if (!editedTask || !$selectedProject || !$selectedProject.id) return

    try {
      const updatedTasks = await window.electron.getTasksToday(
        $selectedProject.id,
      )
      tasksStore.set(updatedTasks)
    } catch (error) {
      console.error('Error refreshing tasks after edit:', error)
    }

    if ($selectedTask && $selectedTask.id === editedTask.id) {
      selectedTask.set(editedTask)
    }
  }
</script>

{#if showEditTaskModal && taskToEdit}
  <EditTaskModal
    task={taskToEdit}
    onClose={() => handleEditModalClose(null)}
    onSuccess={t => handleEditModalClose(t)}
  />
{/if}

{#if $activeTasks.length > 0}
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
                <th class="w-0"></th>
                <th class="w-0"></th>
              </tr>
            </thead>
            <tbody>
              {#each $activeTasks as task (task.taskId)}
                <tr class="hover:bg-base-100">
                  <td>{task.companyName} > {task.projectName} > {task.name}</td>
                  <td>
                    <TimerComponent {task} />
                  </td>
                  <td>{task.date}</td>
                  <td>
                    <span class="tooltip" data-tip="Edit">
                      <button
                        class="btn btn-soft btn-circle btn-accent"
                        onclick={() => handleEditTask(task.taskId)}
                      >
                        <SquarePen size="16" />
                      </button>
                    </span>
                  </td>
                  <td>
                    <span class="tooltip" data-tip="Done">
                      <button
                        class="btn btn-success btn-soft btn-circle"
                        onclick={() => handleStopTask(task.taskId)}
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
