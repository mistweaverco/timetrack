<script lang="ts">
  import {
    companies,
    selectedCompany,
    selectedProject,
    projects,
  } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  export let company: DBCompany
  export let onClose: (success: boolean) => void

  async function handleDelete() {
    if (window.electron) {
      const result = await window.electron.deleteCompany(company.name)
      if (result.success) {
        await companies.update(cs => cs.filter(c => c.name !== company.name))
        // Clear selection if deleted company was selected
        if ($selectedCompany.name === company.name) {
          selectedCompany.set({ name: null })
          selectedProject.set({ name: null, company_name: null })
        }
        onClose(true)
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }

  $: companyProjects = $projects.filter(p => p.company_name === company.name)
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Company</h3>
    {#if companyProjects.length > 0}
      <InfoBox type="warning" title="Warning">
        This company has {companyProjects.length} project(s). Deleting it will also
        delete all associated projects, tasks, and task definitions.
      </InfoBox>
    {/if}
    <p class="py-4">
      Are you sure you want to delete the company <strong>{company.name}</strong
      >?
    </p>
    <div class="modal-action">
      <button type="button" class="btn btn-error" on:click={handleDelete}>
        Delete
      </button>
      <button type="button" class="btn" on:click={handleCancel}>Cancel</button>
    </div>
  </div>
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
