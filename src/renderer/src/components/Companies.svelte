<script lang="ts">
  import { onMount } from 'svelte'
  import { Button, buttonVariants } from '@ui/button'
  import * as Tooltip from '@ui/tooltip'
  import { companies, selectedCompany, selectedProject } from '../stores'
  import EditCompanyModal from './modals/EditCompanyModal.svelte'
  import DeleteCompanyModal from './modals/DeleteCompanyModal.svelte'
  import { Plus, Settings } from '@lucide/svelte'

  let companiesList: DBCompany[] = []
  let showEditModal = false
  let showDeleteModal = false
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

  function handleEditClick(company: DBCompany) {
    companyToEdit = company
    showEditModal = true
  }

  function handleDeleteClick(company: DBCompany) {
    companyToDelete = company
    showDeleteModal = true
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

{#if showEditModal && companyToEdit}
  <EditCompanyModal
    company={companyToEdit}
    onClose={(s, c) => handleCompanyModalClose(s, c)}
  />
{/if}

{#if showDeleteModal && companyToDelete}
  <DeleteCompanyModal
    company={companyToDelete}
    onClose={s => handleCompanyModalClose(s)}
  />
{/if}

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
    <li>
      {#if $selectedCompany.id !== null}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              class={buttonVariants({
                variant: 'outline',
              })}><Settings size="16" /></Tooltip.Trigger
            >
            <Tooltip.Content>
              <p>Edit selected company</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
    </li>
  </ul>
</div>

<section class="section">
  <h1 class="text-2xl font-bold">Companies</h1>
  <h2 class="text-lg text-base-content/70">
    Manage your companies. Select a company to view its projects.
  </h2>

  <div class="grid grid-cols-2 gap-4 mt-4">
    <!-- Add Company -->
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">New Company</h2>
        <form on:submit={handleAddCompany}>
          <div class="form-control">
            <label class="label" for="name">
              <span class="label-text">Company Name</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Company Name"
              class="input input-bordered"
              required
            />
          </div>
          <div class="form-control mt-4">
            <button type="submit" class="btn btn-primary">Add Company</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Companies List -->
    {#if companiesList.length > 0}
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Companies</h2>
          <div class="space-y-2">
            {#each companiesList as company (company.name)}
              <div class="flex justify-between items-center">
                <button
                  class="p-3 rounded cursor-pointer transition-colors w-full text-left border-2"
                  class:bg-base-300={$selectedCompany.id === company.id}
                  class:text-neutral-content={$selectedCompany.id ===
                    company.id}
                  class:border-success={$selectedCompany.id === company.id}
                  class:border-base-100={$selectedCompany.id !== company.id}
                  class:tooltip={false}
                  data-tip={companiesWithActiveTasks.has(company.name)
                    ? 'A task belonging to this company is currently active, you need to stop it to perform any action.'
                    : ''}
                  on:click={() => handleCompanySelect(company)}
                >
                  {#if companiesWithActiveTasks.has(company.name)}
                    <div class="flex gap-2 justify-between">
                      <span>{company.name}</span>
                      <span
                        class="loading loading-spinner loading-xs text-success"
                      ></span>
                    </div>
                  {:else}
                    <span>{company.name}</span>
                  {/if}
                </button>
                {#if !companiesWithActiveTasks.has(company.name)}
                  <div class="flex gap-2">
                    <button
                      class="btn btn-warning btn-sm"
                      on:click|stopPropagation={() => handleEditClick(company)}
                    >
                      Edit
                    </button>
                    <button
                      class="btn btn-error btn-sm"
                      on:click|stopPropagation={() =>
                        handleDeleteClick(company)}
                    >
                      Delete
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>
