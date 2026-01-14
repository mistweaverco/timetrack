<script lang="ts">
  let { onClose } = $props<{
    onClose: (success: boolean) => void
  }>()
  import Label from 'renderer/src/lib/shacn/components/ui/label/label.svelte'
  import * as Dialog from '@ui/dialog'
  import Input from 'renderer/src/lib/shacn/components/ui/input/input.svelte'
  import { Button, buttonVariants } from '@ui/button'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const name = formData.get('name') as string

    if (name && window.electron) {
      const result = await window.electron.addCompany(name)
      if (result.success) {
        form.reset()
      }
    }
  }
</script>

<Dialog.Root open={true} onOpenChange={() => onClose(false)}>
  <form onsubmit={handleSubmit}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>Add a new company</Dialog.Title>
        <Dialog.Description>
          Add a new company by providing its name below. Click save when you're
          done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid gap-4">
        <div class="grid gap-3">
          <div class="grid grid-cols-1 gap-4">
            <Label for="name">Name</Label>
            <Input id="name" type="text" />
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
