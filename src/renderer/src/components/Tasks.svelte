<script lang="ts">
  import { onMount } from 'svelte'
  import {
    tasks,
    taskDefinitions,
    selectedProject,
    activeTasks,
    selectedTask,
    selectedTaskDefinition,
  } from '../stores'
  import EditTaskModal from './modals/EditTaskModal.svelte'
  import DeleteTaskModal from './modals/DeleteTaskModal.svelte'
  import {
    Plus,
    Play,
    SquarePen,
    Trash,
    SquareCheckBig,
    Ellipsis,
    EyeOff,
  } from '@lucide/svelte'

  let tasksList: DBTask[] = []
  let taskDefs: DBTaskDefinition[] = $state([])
  let showEditModal = $state(false)
  let showDeleteModal = $state(false)
  let showMoreMenu = $state(false)
  let selectedTaskData: DBTask | null = $selectedTask

  onMount(async () => {
    tasks.subscribe(value => {
      tasksList = value
    })

    taskDefinitions.subscribe(value => {
      taskDefs = value
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

  async function handleAddTask() {
    if (!$selectedProject || !$selectedTaskDefinition) return

    if (window.electron) {
      const result = await window.electron.addTask({
        taskDefinitionId: $selectedTaskDefinition.id,
        description: '',
        seconds: 0,
      })
      if (result.success) {
        await fetchTasks($selectedProject.id)
        const newTask = await window.electron.getTaskById(result.id)
        selectedTask.set(newTask)
      }
    }
  }

  async function handleStartTask() {
    const existingTask = await window.electron.getTaskByTaskDefinitionAndDate(
      $selectedTaskDefinition.id,
      new Date().toISOString().slice(0, 10),
    )

    if (existingTask) {
      selectedTask.set(existingTask)
    }

    if (!$selectedTask) {
      await handleAddTask()
    }

    if (window.electron) {
      const result = await window.electron.startActiveTask(selectedTaskData.id)
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

  function onTaskDefinitionSelect(e: Event) {
    const select = e.target as HTMLSelectElement
    const taskDefId = select.value
    if (taskDefId === '') {
      selectedTaskDefinition.set(null)
      selectedTask.set(null)
      return
    }
    const taskDef = $taskDefinitions.find(td => td.id === taskDefId) || null
    selectedTaskDefinition.set(taskDef)
    const existingTask = tasksList.find(
      t =>
        t.taskDefinitionId === taskDefId &&
        t.date === new Date().toISOString().slice(0, 10),
    )
    selectedTask.set(existingTask)
  }

  async function handleEditModalClose(success: boolean, editedTask?: DBTask) {
    showEditModal = false
    if (success && $selectedProject.id) {
      // Refresh tasks list to reflect changes (especially if date changed)
      await fetchTasks($selectedProject.id)

      // If date changed, clear selection since task is no longer in today's list
      if (editedTask && editedTask.date !== $selectedTask.date) {
        selectedTask.set(null)
      } else if (editedTask) {
        // Update selected task if it was the one edited
        selectedTask.set(editedTask)
      }
    }
  }

  function handleDeleteModalClose() {
    showDeleteModal = false
  }
  function handleDeleteModalSuccess() {
    showDeleteModal = false
  }
</script>

{#if showEditModal}
  <EditTaskModal onClose={(s, t) => handleEditModalClose(s, t)} />
{/if}

{#if showDeleteModal}
  <DeleteTaskModal
    onClose={handleDeleteModalClose}
    onSuccess={handleDeleteModalSuccess}
  />
{/if}

{#if $selectedProject && $selectedProject.id}
  <div class="flex justify-between">
    <ul class="flex space-x-2">
      {#if taskDefs.length > 0}
        <li>
          <span class="tooltip tooltip-bottom" data-tip="Tasks">
            <span class="flex space-x-2">
              <label
                class="label icon {$selectedTaskDefinition &&
                $selectedTaskDefinition.name !== ''
                  ? 'text-accent'
                  : ''}"
                for="task-select"
              >
                <SquareCheckBig size="16" />
              </label>
              <select
                id="task-select"
                onchange={onTaskDefinitionSelect}
                class="select {$selectedTaskDefinition &&
                $selectedTaskDefinition.name !== ''
                  ? 'select-accent'
                  : ''}"
              >
                <option value="" selected={!$selectedTaskDefinition}
                  >Select a Task</option
                >
                {#each taskDefs as td (td.id)}
                  <option
                    selected={$selectedTaskDefinition &&
                      $selectedTaskDefinition.name === td.name}
                    value={td.id}>{td.name}</option
                  >
                {/each}
              </select>
            </span>
          </span>
        </li>
      {/if}
      {#if $selectedTaskDefinition && $selectedTaskDefinition.id}
        <li>
          <div
            class="tooltip tooltip-bottom hover:btn-success"
            data-tip="Start Task"
          >
            <button class="btn" onclick={handleStartTask}
              ><Play size="16" /></button
            >
          </div>
        </li>
      {/if}
      {#if $selectedTask && $selectedTask.id}
        <li>
          <div class="tooltip tooltip-bottom" data-tip="Edit Task">
            <button class="btn" onclick={() => (showEditModal = true)}
              ><SquarePen size="16" />
            </button>
          </div>
        </li>
        <li>
          <div
            class="tooltip tooltip-bottom hover:btn-error"
            data-tip="Remove Task"
          >
            <button class="btn" onclick={() => (showDeleteModal = true)}
              ><Trash size="16" /></button
            >
          </div>
        </li>
      {/if}
      {#if $selectedTaskDefinition && $selectedTaskDefinition.id}
        <li>
          <button
            tabindex="0"
            class="btn btn-soft {showMoreMenu ? 'btn-warning' : ''}"
            onclick={() => (showMoreMenu = !showMoreMenu)}
          >
            {#if !showMoreMenu}
              <Ellipsis size="16" />
            {:else}
              <EyeOff size="16" />
            {/if}
          </button>
        </li>
        {#if showMoreMenu}
          <li>
            <div class="tooltip tooltip-bottom" data-tip="Edit Task Definition">
              <button class="btn btn-soft"><SquarePen size="16" /> </button>
            </div>
          </li>
          <li>
            <div
              class="tooltip tooltip-bottom"
              data-tip="Delete Task Definition"
            >
              <button class="btn btn-soft"><Trash size="16" /> </button>
            </div>
          </li>
          {#if taskDefs.length > 0}
            <li>
              <div
                class="tooltip tooltip-bottom"
                data-tip="Add a new task definition"
              >
                <button class="btn btn-soft"><Plus size="16" /></button>
              </div>
            </li>
          {/if}
        {/if}
      {/if}
      {#if taskDefs.length === 0}
        <li>
          <div
            class="tooltip tooltip-bottom"
            data-tip="Add a new task definition"
          >
            <button class="btn btn-soft"><Plus size="16" /></button>
          </div>
        </li>
      {/if}
    </ul>
  </div>
{/if}
