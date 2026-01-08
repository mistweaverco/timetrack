<script lang="ts">
  import { onMount } from 'svelte'
  import moment from 'moment'
  import {
    tasks,
    taskDefinitions,
    selectedProject,
    activeTasks,
    selectedTask,
  } from '../stores'
  import EditTaskModal from './modals/EditTaskModal.svelte'
  import DeleteTaskModal from './modals/DeleteTaskModal.svelte'
  import TimerComponent from './TimerComponent.svelte'
  import TimeInputComponent from './TimeInputComponent.svelte'
  import InfoBox from './InfoBox.svelte'

  let tasksList: DBTask[] = []
  let taskDefs: DBTaskDefinition[] = []
  let showEditModal = false
  let showDeleteModal = false
  let taskToEdit: DBTask | null = null
  let taskToDelete: DBTask | null = null
  let taskName = ''
  let taskDescription = ''
  let taskHours = 0
  let taskMinutes = 0
  let taskSeconds = 0

  $: selectedProj = $selectedProject
  $: activeTasksList = $activeTasks
  $: selectedTaskData = $selectedTask

  onMount(async () => {
    tasks.subscribe(value => {
      tasksList = value
    })

    taskDefinitions.subscribe(value => {
      taskDefs = value
    })

    selectedProject.subscribe(async proj => {
      if (proj.name) {
        await fetchTaskDefinitions(proj.name)
        await fetchTasks(proj.name)
      }
    })
  })

  async function fetchTaskDefinitions(projectName: string) {
    if (window.electron) {
      try {
        const data = (
          await window.electron.getTaskDefinitions(projectName)
        ).filter((taskDef: DBTaskDefinition) => taskDef.status === 'active')
        taskDefinitions.set(data)
      } catch (error) {
        console.error('Error loading task definitions:', error)
      }
    }
  }

  async function fetchTasks(projectName: string) {
    if (window.electron) {
      try {
        const data = (await window.electron.getTasksToday(projectName)).filter(
          (task: DBTask) => task.status === 'active',
        )
        tasks.set(data)
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    }
  }

  async function handleAddTask(e: Event) {
    e.preventDefault()
    if (!selectedProj.name || !taskName) return

    const totalSeconds = taskHours * 3600 + taskMinutes * 60 + taskSeconds

    if (window.electron) {
      const result = await window.electron.addTask({
        name: taskName,
        description: taskDescription,
        project_name: selectedProj.name,
        seconds: totalSeconds,
      })
      if (result.success) {
        await fetchTasks(selectedProj.name)
        // Reset form
        taskName = ''
        taskDescription = ''
        taskHours = 0
        taskMinutes = 0
        taskSeconds = 0
      }
    }
  }

  function handleTaskSelect(task: DBTask) {
    selectedTask.set(task)
  }

  async function handleStartTask() {
    if (!selectedTaskData) return

    if (window.electron) {
      const result = await window.electron.startActiveTask({
        name: selectedTaskData.name,
        project_name: selectedTaskData.project_name,
        description: selectedTaskData.description,
        date: selectedTaskData.date,
        seconds: selectedTaskData.seconds,
      })
      if (result.success) {
        await activeTasks.update(ats => {
          const exists = ats.find(
            at =>
              at.name === result.name &&
              at.project_name === result.project_name &&
              at.date === result.date,
          )
          if (!exists) {
            return [...ats, { ...result, isActive: true }]
          }
          return ats
        })
      }
    }
  }

  function handleEditClick(task: DBTask) {
    taskToEdit = task
    showEditModal = true
  }

  function handleDeleteClick(task: DBTask) {
    taskToDelete = task
    showDeleteModal = true
  }

  async function handleEditModalClose(success: boolean, editedTask?: DBTask) {
    showEditModal = false
    if (success && selectedProj.name) {
      // Refresh tasks list to reflect changes (especially if date changed)
      await fetchTasks(selectedProj.name)

      // If date changed, clear selection since task is no longer in today's list
      if (editedTask && editedTask.date !== taskToEdit?.date) {
        selectedTask.set(null)
      } else if (editedTask) {
        // Update selected task if it was the one edited
        selectedTask.set(editedTask)
      }
    }
    taskToEdit = null
  }

  function handleDeleteModalClose(success: boolean) {
    showDeleteModal = false
    if (success) {
      selectedTask.set(null)
      if (selectedProj.name) {
        fetchTasks(selectedProj.name)
      }
    }
    taskToDelete = null
  }

  function isTaskActive(task: DBTask): boolean {
    return activeTasksList.some(
      at =>
        at.name === task.name &&
        at.project_name === task.project_name &&
        at.date === task.date,
    )
  }

  function isSelected(task: DBTask): boolean {
    return (
      selectedTaskData?.name === task.name &&
      selectedTaskData?.project_name === task.project_name &&
      selectedTaskData?.date === task.date
    )
  }

  function getDummyTask(): DBTask {
    return {
      name: '',
      description: '',
      project_name: selectedProj.name || '',
      seconds: 0,
      date: '',
    }
  }
</script>

{#if showEditModal && taskToEdit}
  <EditTaskModal
    task={taskToEdit}
    onClose={(s, t) => handleEditModalClose(s, t)}
  />
{/if}

{#if showDeleteModal && taskToDelete}
  <DeleteTaskModal task={taskToDelete} onClose={handleDeleteModalClose} />
{/if}

{#if taskDefs.length > 0 && selectedProj.name}
  <section class="section">
    <h1 class="text-2xl font-bold">Tasks</h1>
    <h2 class="text-lg text-base-content/70">
      All available tasks for a given project
    </h2>

    <div class="grid grid-cols-3 gap-4 mt-4">
      <!-- New Task -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">New</h2>
          <form on:submit={handleAddTask}>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Task Definition</span>
              </label>
              <select
                bind:value={taskName}
                class="select select-bordered"
                required
              >
                <option value="">Select task definition</option>
                {#each taskDefs as td}
                  <option value={td.name}>{td.name}</option>
                {/each}
              </select>
            </div>
            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text">Task Description</span>
              </label>
              <textarea
                bind:value={taskDescription}
                class="textarea textarea-bordered"
                placeholder="Task Description"
              ></textarea>
            </div>
            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text">Task Duration</span>
              </label>
              <div class="grid grid-cols-3 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Hours</span>
                  </label>
                  <input
                    type="number"
                    bind:value={taskHours}
                    min="0"
                    class="input input-bordered"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Minutes</span>
                  </label>
                  <input
                    type="number"
                    bind:value={taskMinutes}
                    min="0"
                    max="59"
                    class="input input-bordered"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Seconds</span>
                  </label>
                  <input
                    type="number"
                    bind:value={taskSeconds}
                    min="0"
                    max="59"
                    class="input input-bordered"
                  />
                </div>
              </div>
              <input
                type="hidden"
                name="seconds"
                value={taskHours * 3600 + taskMinutes * 60 + taskSeconds}
              />
            </div>
            <div class="form-control mt-4">
              <button type="submit" class="btn btn-primary">Add Task</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Today's Tasks -->
      {#if tasksList.length > 0}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Today</h2>
            <div class="space-y-2">
              {#each tasksList as task}
                <div
                  class="p-3 rounded cursor-pointer transition-colors"
                  class:bg-primary={isSelected(task)}
                  class:text-primary-content={isSelected(task)}
                  on:click={() => handleTaskSelect(task)}
                >
                  <p class="font-semibold">{task.name}</p>
                  <div class="flex items-center gap-4 mt-2">
                    {#if isTaskActive(task)}
                      <span class="badge badge-success">Running</span>
                    {:else}
                      <TimerComponent {task} />
                    {/if}
                    <span class="text-sm">{task.date}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      {#if selectedTaskData}
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Actions</h2>
            {#if isTaskActive(selectedTaskData)}
              <InfoBox type="warning" title="Warning">
                Task is currently active, you need to stop it to perform a
                delete action.
              </InfoBox>
              <button
                class="btn btn-warning mt-2"
                on:click={() => handleEditClick(selectedTaskData)}
              >
                Edit
              </button>
            {:else}
              <div class="flex flex-col gap-2">
                <button class="btn btn-primary" on:click={handleStartTask}>
                  Start
                </button>
                <button
                  class="btn btn-warning"
                  on:click={() => handleEditClick(selectedTaskData)}
                >
                  Edit
                </button>
                <button
                  class="btn btn-error"
                  on:click={() => handleDeleteClick(selectedTaskData)}
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}
