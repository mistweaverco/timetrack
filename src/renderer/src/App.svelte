<script lang="ts">
  import { onMount } from 'svelte'
  import { selectedPanel, activeTasks } from './stores'
  import Navigation from './components/Navigation.svelte'
  import Overview from './components/Overview.svelte'
  import Search from './components/Search.svelte'
  import PDFExport from './components/PDFExport.svelte'
  import PDFDocument from './components/PDFDocument.svelte'
  import { searchResults } from './stores'

  let currentPanel = $selectedPanel

  selectedPanel.subscribe(value => {
    currentPanel = value
  })

  import { companies } from './stores'

  onMount(async () => {
    // Load initial data
    if (window.electron) {
      try {
        const companiesData = await window.electron.getCompanies()
        companies.set(companiesData)

        const activeTasksData = await window.electron.getActiveTasks()
        activeTasks.set(activeTasksData)
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }
  })
</script>

<div class="min-h-screen bg-base-100">
  {#if currentPanel !== 'PDFDocument'}
    <Navigation
      {currentPanel}
      onPanelChange={panel => selectedPanel.set(panel)}
    />
  {/if}

  <div class="container mx-auto p-4">
    {#if currentPanel === 'Overview'}
      <Overview />
    {:else if currentPanel === 'Search'}
      <Search />
    {:else if currentPanel === 'PDFExport' || currentPanel === 'PDFDocument'}
      <PDFExport />
    {/if}
  </div>
</div>
