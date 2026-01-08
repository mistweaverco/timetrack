<script lang="ts">
  import { projects, selectedProject } from '../../stores'
  import InfoBox from '../InfoBox.svelte'

  export let project: DBProject
  export let onClose: (success: boolean) => void

  async function handleConfirm() {
    if (window.electron) {
      const result = await window.electron.deleteProject(project.name)
      if (result.success) {
        await projects.update(ps => ps.filter(p => p.name !== project.name))
        if ($selectedProject.name === project.name) {
          selectedProject.set({ name: null, company_name: null })
        }
        onClose(true)
      }
    }
  }

  function handleCancel() {
    onClose(false)
  }
</script>

<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Project</h3>
    <InfoBox type="error" title="Warning">
      <p>Deleting a project is a hazardous action.</p>
      <p>
        If you delete a project, it'll also delete all its tasks and
        task-definitions.
      </p>
      <p>Maybe consider marking it as inactive?</p>
    </InfoBox>
    <p class="mt-4">
      Are you sure you want to delete this project ({project.name})?
    </p>
    <div class="modal-action">
      <button class="btn btn-error" on:click={handleConfirm}>Yes</button>
      <button class="btn btn-primary" on:click={handleCancel}>No</button>
    </div>
  </div>
  <div class="modal-backdrop" on:click={handleCancel}></div>
</div>
