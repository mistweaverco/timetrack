<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { selectedPanel, activeTasks, companies } from './stores'
  import Navigation from './components/Navigation.svelte'
  import Overview from './components/Overview.svelte'
  import Search from './components/Search.svelte'
  import PDFExport from './components/PDFExport.svelte'

  let currentPanel = $selectedPanel
  let isLoading = true
  let loadError: string | null = null

  selectedPanel.subscribe(value => {
    currentPanel = value
  })

  async function loadInitialData() {
    if (!window.electron) {
      loadError = 'Electron API not available'
      isLoading = false
      return
    }

    try {
      const companiesData = await window.electron.getCompanies()
      companies.set(companiesData)

      const activeTasksData = await window.electron.getActiveTasks()
      activeTasks.set(activeTasksData)

      loadError = null
    } catch (error) {
      console.error('Error loading initial data:', error)
      loadError = 'Failed to load initial data. Please restart the app.'
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    // Wait for the main process to signal that IPC handlers are ready
    if (window.electron) {
      window.electron.on('app-ready', () => {
        loadInitialData()
      })
    } else {
      // Fallback: try loading immediately if electron API isn't available
      loadInitialData()
    }
  })

  onDestroy(() => {
    if (window.electron) {
      window.electron.off('app-ready')
    }
  })
</script>

<div class="min-h-screen bg-base-100">
  {#if isLoading}
    <div class="flex h-screen items-center justify-center">
      <div class="text-center space-y-4">
        <div class="loading loading-spinner loading-lg mx-auto"></div>
        <p class="text-sm text-base-content/70">
          Initializing database and loading data&hellip;
        </p>
      </div>
    </div>
  {:else if loadError}
    <div class="flex h-screen items-center justify-center">
      <div class="text-center space-y-4 max-w-md px-4">
        <p class="font-semibold text-error mb-2">Something went wrong</p>
        <p class="text-sm text-base-content/80">{loadError}</p>
      </div>
    </div>
  {:else}
    {#if currentPanel !== 'PDFDocument'}
      <Navigation
        {currentPanel}
        onPanelChange={panel => selectedPanel.set(panel)}
      />
    {/if}

    <div class="w-full p-4">
      {#if currentPanel === 'Overview'}
        <Overview />
      {:else if currentPanel === 'Search'}
        <Search />
      {:else if currentPanel === 'PDFExport' || currentPanel === 'PDFDocument'}
        <PDFExport />
      {/if}
    </div>
  {/if}
</div>
