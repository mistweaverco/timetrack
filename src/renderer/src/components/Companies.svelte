<script lang="ts">
  import { onMount } from 'svelte'
  import {
    companies,
    selectedCompany,
    selectedProject,
    projects,
    activeTasks,
  } from '../stores'
  import EditCompanyModal from './modals/EditCompanyModal.svelte'
  import DeleteCompanyModal from './modals/DeleteCompanyModal.svelte'
  import InfoBox from './InfoBox.svelte'

  let companiesList: DBCompany[] = []
  let showEditModal = false
  let showDeleteModal = false
  let companyToEdit: DBCompany | null = null
  let companyToDelete: DBCompany | null = null

  $: activeTasksList = $activeTasks
  $: selectedComp = $selectedCompany

  onMount(async () => {
    await fetchCompanies()
  })

  companies.subscribe(value => {
    companiesList = value
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
    selectedCompany.set({ name: company.name })
    // Clear selected project when company changes
    selectedProject.set({ name: null, company_name: null })
  }

  function handleEditClick(company: DBCompany) {
    companyToEdit = company
    showEditModal = true
  }

  function handleDeleteClick(company: DBCompany) {
    companyToDelete = company
    showDeleteModal = true
  }

  function isSelected(company: DBCompany): boolean {
    return selectedComp.name === company.name
  }

  function hasActiveTask(companyName: string): boolean {
    // Check if any active task belongs to a project in this company
    return activeTasksList.some(at => {
      const project = $projects.find(p => p.name === at.project_name)
      return project && project.company_name === companyName
    })
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
        if (selectedComp.name === companyToEdit.name) {
          selectedCompany.set({ name: editedCompany.name })
        }
      } else if (companyToDelete) {
        // Clear selection if deleted company was selected
        if (selectedComp.name === companyToDelete.name) {
          selectedCompany.set({ name: null })
          selectedProject.set({ name: null, company_name: null })
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
            <label class="label">
              <span class="label-text">Company Name</span>
            </label>
            <input
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
            {#each companiesList as company}
              <div
                class="p-3 rounded cursor-pointer transition-colors"
                class:bg-primary={isSelected(company)}
                class:text-primary-content={isSelected(company)}
                on:click={() => handleCompanySelect(company)}
              >
                <div class="flex justify-between items-center">
                  <p class="font-semibold">{company.name}</p>
                  <div class="flex gap-2">
                    {#if hasActiveTask(company.name)}
                      <InfoBox type="warning" title="Warning">
                        A task belonging to this company is currently active,
                        you need to stop it to perform any action.
                      </InfoBox>
                    {:else}
                      <button
                        class="btn btn-warning btn-sm"
                        on:click|stopPropagation={() =>
                          handleEditClick(company)}
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
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>
