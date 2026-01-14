<script lang="ts">
  let props = $props()
  import { Textarea } from '@ui/textarea'
  import { Calendar } from '@ui/calendar'
  import * as Popover from '@ui/popover/index.js'
  import { ChevronDownIcon } from '@lucide/svelte'
  import {
    getLocalTimeZone,
    today,
    CalendarDate,
  } from '@internationalized/date'

  import { Button, buttonVariants } from '@ui/button'
  import * as Dialog from '@ui/dialog'
  import { Input } from '@ui/input'
  import { Label } from '@ui/label'
  import { activeTasks } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  const task: DBTask = props.task
  const onClose: (success: boolean, editedTask?: DBTask) => void =
    props.onClose || (() => {})

  let description = $state(task.description)
  let hours = $state(Math.floor(task.seconds / 3600))
  let minutes = $state(Math.floor((task.seconds % 3600) / 60))
  let seconds = $state(task.seconds % 60)
  let date = task.date
  let status = task.status || 'active'
  const oldDate = task.date

  let activeTask: ActiveTask | undefined
  let isActive = $state(false)
  let currentSeconds = task.seconds

  $effect(() => {
    activeTask = $activeTasks.find(
      at => at.taskId === task.id && at.date === oldDate,
    )
    isActive = activeTask !== undefined && activeTask.isActive
    currentSeconds = hours * 3600 + minutes * 60 + seconds
  })

  let datepickerOpen = $state(false)
  let datepickerValue = $state<CalendarDate | undefined>(
    new CalendarDate(
      parseInt(date.slice(0, 4)),
      parseInt(date.slice(5, 7)),
      parseInt(date.slice(8, 10)),
    ),
  )

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editTask({
        id: task.id,
        taskDefinitionId: task.taskDefinitionId,
        description,
        seconds: currentSeconds,
        date: date,
        oldDate: oldDate,
        status,
      })

      if (result.success) {
        // Update active tasks if task is active
        if (activeTask) {
          activeTasks.update(ats =>
            ats.map(at =>
              at.taskId === task.id && at.date === oldDate
                ? { ...at, description, seconds: currentSeconds, date: date }
                : at,
            ),
          )
        }

        // Pass edited task back to parent - parent will refresh from database
        onClose(true, {
          ...task,
          description,
          seconds: currentSeconds,
          date: date,
          status,
        })
      }
    }
  }
</script>

<Dialog.Root open={true} onOpenChange={() => onClose(false)}>
  <form onsubmit={handleSubmit}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>Edit Task: {task.name}</Dialog.Title>
        <Dialog.Description>
          Make changes to your task here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid gap-4">
        <div class="grid gap-3">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            bind:value={description}
          />
        </div>
        <div class="grid gap-3">
          <Label for="date">Task date</Label>
          {#if isActive}
            <InfoBox type="warning" title="Warning">
              Editing the <strong>date</strong> of an
              <strong>active task</strong> is not allowed. You can stop the task first,
              and then edit the date.
            </InfoBox>
          {/if}
          <div class="flex flex-col gap-3">
            <Popover.Root bind:open={datepickerOpen}>
              <Popover.Trigger id="date">
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    class="w-48 justify-between font-normal"
                  >
                    {datepickerValue
                      ? datepickerValue
                          .toDate(getLocalTimeZone())
                          .toLocaleDateString()
                      : 'Select date'}
                    <ChevronDownIcon />
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  type="single"
                  bind:value={datepickerValue}
                  captionLayout="dropdown"
                  onValueChange={() => {
                    datepickerOpen = false
                  }}
                  maxValue={today(getLocalTimeZone())}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
        </div>
        <div class="grid gap-3">
          {#if isActive}
            <InfoBox type="warning" title="Warning">
              Editing the <strong>duration</strong> of an
              <strong>active task</strong> is not allowed. You can stop the task first,
              and then edit the duration.
            </InfoBox>
          {/if}
          <div class="grid grid-cols-3 gap-4">
            <Label for="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              bind:value={hours}
              min="0"
              disabled={isActive}
            />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <Label for="hours">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              bind:value={minutes}
              min="0"
              max="59"
              disabled={isActive}
            />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <Label for="hours">Seconds</Label>
            <Input
              id="seconds"
              type="number"
              bind:value={seconds}
              min="0"
              max="59"
              disabled={isActive}
            />
          </div>
          <Dialog.Footer>
            <Dialog.Close class={buttonVariants({ variant: 'outline' })}
              >Cancel</Dialog.Close
            >
            <Button type="submit">Save changes</Button>
          </Dialog.Footer>
        </div>
      </div></Dialog.Content
    >
  </form>
</Dialog.Root>
