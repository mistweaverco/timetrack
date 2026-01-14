<script lang="ts">
  import Label from 'renderer/src/lib/shacn/components/ui/label/label.svelte'
  import { companies } from '../../stores'
  import * as Dialog from '@ui/dialog'
  import Input from 'renderer/src/lib/shacn/components/ui/input/input.svelte'
  import { Button, buttonVariants } from '@ui/button'

  export let company: DBCompany
  export let onClose: (success: boolean, editedCompany?: DBCompany) => void

  let name = company.name
  let status = company.status || 'active'

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (window.electron) {
      const result = await window.electron.editCompany({
        id: company.id,
        name,
        status,
      })

      if (result.success) {
        companies.update(cs =>
          cs.map(c => (c.id === company.id ? { ...c, name, status } : c)),
        )
        onClose(true, { id: company.id, name, status })
      }
    }
  }
</script>

<Dialog.Root open={true} onOpenChange={() => onClose(false)}>
  <form onsubmit={handleSubmit}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>Edit Company: {company.name}</Dialog.Title>
        <Dialog.Description>
          Make changes to your company here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid gap-4">
        <div class="grid gap-3">
          <Label for="description">Name</Label>
          <div class="grid grid-cols-3 gap-4">
            <Label for="name">Name</Label>
            <Input id="name" type="text" bind:value={name} />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <Label for="status">Status</Label>
            <select
              bind:value={status}
              class="select select-bordered"
              required
              id="status"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
