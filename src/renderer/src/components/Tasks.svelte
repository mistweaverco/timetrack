<script lang="ts">
  import { onMount } from 'svelte'
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
  import InfoBox from './InfoBox.svelte'

  let tasksList: DBTask[] = []
  let taskDefs: DBTaskDefinition[] = []
  let showEditModal = false
  let showDeleteModal = false
  let taskToEdit: DBTask | null = null
  let taskToDelete: DBTask | null = null
  let activeTasksList: ActiveTask[] = $activeTasks
  let selectedTaskData: DBTask | null = $selectedTask
  let taskName = ''
  let taskDescription = ''
  let taskHours = 0
  let taskMinutes = 0
  let taskSeconds = 0

  $: selectedProj = $selectedProject

  onMount(async () => {
    tasks.subscribe(value => {
      tasksList = value
    })

    taskDefinitions.subscribe(value => {
      taskDefs = value
    })

    activeTasks.subscribe(value => {
      activeTasksList = value
    })

    selectedTask.subscribe(value => {
      selectedTaskData = value
    })

    selectedProject.subscribe(async proj => {
      if (proj && proj.id) {
        await fetchTaskDefinitions(proj.id)
        await fetchTasks(proj.id)
      }
    })
  })

  async function fetchTaskDefinitions(projectId: string) {
    if (window.electron) {
      try {
        const data = (
          await window.electron.getTaskDefinitions(projectId)
        ).filter((taskDef: DBTaskDefinition) => taskDef.status === 'active')
        taskDefinitions.set(data)
      } catch (error) {
        console.error('Error loading task definitions:', error)
      }
    }
  }

  async function fetchTasks(projectId: string) {
    if (window.electron) {
      try {
        const data = (await window.electron.getTasksToday(projectId)).filter(
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
    if (!selectedProj.id || !taskName) return

    const totalSeconds = taskHours * 3600 + taskMinutes * 60 + taskSeconds

    // Find the selected task definition by name
    const selectedTaskDef = taskDefs.find(td => td.name === taskName)
    if (!selectedTaskDef) return

    if (window.electron) {
      const result = await window.electron.addTask({
        taskDefinitionId: selectedTaskDef.id,
        description: taskDescription,
        seconds: totalSeconds,
      })
      if (result.success) {
        await fetchTasks(selectedProj.id)
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
        taskId: selectedTaskData.id,
        description: selectedTaskData.description,
        date: selectedTaskData.date,
        seconds: selectedTaskData.seconds,
      })
      if (result.success) {
        selectedTask.set(selectedTaskData)
        activeTasks.update(ats => {
          const exists = ats.find(
            at => at.taskId === result.taskId && at.date === result.date,
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
    if (success && selectedProj.id) {
      // Refresh tasks list to reflect changes (especially if date changed)
      await fetchTasks(selectedProj.id)

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
      if (selectedProj.id) {
        fetchTasks(selectedProj.id)
      }
    }
    taskToDelete = null
  }

  function isTaskActive(task: DBTask): boolean {
    return activeTasksList.some(
      at => at.taskId === task.id && at.date === task.date,
    )
  }

  function isSelected(task: DBTask): boolean {
    return (
      selectedTaskData?.name === task.name &&
      selectedTaskData?.projectName === task.projectName &&
      selectedTaskData?.date === task.date
    )
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

{#if taskDefs.length > 0 && selectedProj.id}
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
              <label class="label" for="taskName">
                <span class="label-text">Task Definition</span>
              </label>
              <select
                id="taskName"
                bind:value={taskName}
                class="select select-bordered"
                required
              >
                <option value="">Select task definition</option>
                {#each taskDefs as td (td.name)}
                  <option value={td.name}>{td.name}</option>
                {/each}
              </select>
            </div>
            <div class="form-control mt-2">
              <label class="label" for="description">
                <span class="label-text">Task Description</span>
              </label>
              <textarea
                id="description"
                bind:value={taskDescription}
                class="textarea textarea-bordered"
                placeholder="Task Description"
              ></textarea>
            </div>
            <div class="form-control mt-2">
              <label class="label" for="duration">
                <span class="label-text">Task Duration</span>
              </label>
              <div class="grid grid-cols-3 gap-4" id="duration">
                <div class="form-control">
                  <label class="label" for="hours">
                    <span class="label-text">Hours</span>
                  </label>
                  <input
                    id="hours"
                    type="number"
                    bind:value={taskHours}
                    min="0"
                    class="input input-bordered"
                  />
                </div>
                <div class="form-control">
                  <label class="label" for="minutes">
                    <span class="label-text">Minutes</span>
                  </label>
                  <input
                    id="minutes"
                    type="number"
                    bind:value={taskMinutes}
                    min="0"
                    max="59"
                    class="input input-bordered"
                  />
                </div>
                <div class="form-control">
                  <label class="label" for="seconds">
                    <span class="label-text">Seconds</span>
                  </label>
                  <input
                    id="seconds"
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
              {#each tasksList as task (task.name + task.date)}
                <button
                  class="p-3 rounded cursor-pointer transition-color w-full text-left border-2"
                  class:bg-base-300={isSelected(task)}
                  class:text-neutral-content={isSelected(task)}
                  class:border-success={isSelected(task)}
                  class:border-base-100={!isSelected(task)}
                  on:click={() => handleTaskSelect(task)}
                >
                  <p class="font-semibold text-left">{task.name}</p>
                  <div class="flex items-center gap-4 mt-2">
                    {#if isTaskActive(task)}
                      <span
                        class="loading loading-spinner loading-xs text-success"
                      ></span>
                    {:else}
                      <TimerComponent {task} />
                    {/if}
                    <span class="text-sm">{task.date}</span>
                  </div>
                </button>
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
