<script lang="ts">
  import { onMount } from 'svelte'
  import { Button, buttonVariants } from '@ui/button'
  import * as Tooltip from '@ui/tooltip'
  import { companies, selectedCompany, selectedProject } from '../stores'
  import AddCompanyModal from './modals/AddCompanyModal.svelte'
  import EditCompanyModal from './modals/EditCompanyModal.svelte'
  import DeleteCompanyModal from './modals/DeleteCompanyModal.svelte'
  import { Delete, Plus, Settings } from '@lucide/svelte'

  let companiesList: DBCompany[] = $state([])
  let showEditModal = $state(false)
  let showDeleteModal = $state(false)
  let showAddModal = $state(false)
  let companyToEdit: DBCompany | null = null
  let companyToDelete: DBCompany | null = null
  let companiesWithActiveTasks: Set<string> = new Set()

  companies.subscribe(value => {
    companiesList = value
  })

  onMount(async () => {
    await fetchCompanies()
  })

  async function fetchCompanies() {
    if (window.electron) {
      try {
        const data = (await window.electron.getCompanies()).filter(
          (company: DBCompany) => company.status === 'active',
        )

        companies.set(data)
      } catch (error) {
        console.error('Error loading companies:', error)
      }
    }
  }

  async function handleAddCompany(e: Event) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const name = formData.get('name') as string

    if (name && window.electron) {
      const result = await window.electron.addCompany(name)
      if (result.success) {
        await fetchCompanies()
        form.reset()
      }
    }
  }

  function handleCompanySelect(company: DBCompany) {
    selectedCompany.set({ id: company.id, name: company.name })
    // Clear selected project when company changes
    selectedProject.set({ id: null, name: null })
  }

  function handleEditClick() {
    showEditModal = true
  }

  function handleDeleteClick() {
    showDeleteModal = true
  }

  async function handleCompanyAddModalClose(success: boolean) {
    showAddModal = false
    if (success) {
      await fetchCompanies()
    }
  }

  async function handleCompanyModalClose(
    success: boolean,
    editedCompany?: DBCompany,
  ) {
    showEditModal = false
    showDeleteModal = false
    if (success) {
      await fetchCompanies()
      if (editedCompany && companyToEdit) {
        // Update selected company if it was edited
        if ($selectedCompany.id === companyToEdit.id) {
          selectedCompany.set({
            id: editedCompany.id,
            name: editedCompany.name,
          })
        }
      } else if (companyToDelete) {
        // Clear selection if deleted company was selected
        if ($selectedCompany.id === companyToDelete.id) {
          selectedCompany.set({ id: null, name: null })
          selectedProject.set({ id: null, name: null })
        }
      }
    }
    companyToEdit = null
    companyToDelete = null
  }
</script>

<div class="flex justify-between">
  <ul class="flex space-x-2">
    {#each companiesList as company (company.name)}
      <li>
        <Button
          variant={$selectedCompany.id === company.id ? 'default' : 'outline'}
          class="justify-between"
          onclick={() => handleCompanySelect(company)}
        >
          {company.name}
        </Button>
      </li>
    {/each}
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => {
              showAddModal = true
            }}
            class="{buttonVariants({
              variant: 'outline',
            })} justify-between"><Plus size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>Add a company</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
    {#if $selectedCompany.id !== null}
      <li>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={handleEditClick}
              class={buttonVariants({
                variant: 'outline',
              })}><Settings size="16" /></Tooltip.Trigger
            >
            <Tooltip.Content>
              <p>Edit selected company</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </li>
      <li>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={handleDeleteClick}
              class={buttonVariants({
                variant: 'outline',
              })}><Delete size="16" /></Tooltip.Trigger
            >
            <Tooltip.Content>
              <p>Delete selected company</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </li>
    {/if}
  </ul>
</div>

{#if showAddModal}
  <AddCompanyModal onClose={s => handleCompanyAddModalClose(s)} />
{/if}

{#if showEditModal && $selectedCompany}
  <EditCompanyModal
    company={$selectedCompany}
    onClose={(s, c) => handleCompanyModalClose(s, c)}
  />
{/if}

{#if showDeleteModal && $selectedCompany}
  <DeleteCompanyModal
    company={$selectedCompany}
    onClose={s => handleCompanyModalClose(s)}
  />
{/if}
