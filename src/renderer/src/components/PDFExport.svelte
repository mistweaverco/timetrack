<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte'
  import moment from 'moment'
  import { selectedPanel, projects, taskDefinitions } from '../stores'
  import PDFDocument from './PDFDocument.svelte'

  let allProjects: DBProject[] = []
  let allTaskDefinitions: DBTaskDefinition[] = []
  let selectedTasks: Array<{ project_name: string; name: string }> = []
  let fromDate = moment().format('YYYY-MM-DD')
  let toDate = moment().format('YYYY-MM-DD')
  let pdfData: PDFQueryResult[] | null = null
  let eventListenersAdded = false
  let showingPDF = false

  $: formValid = fromDate && toDate && selectedTasks.length > 0
  $: shouldShowPDFDocument = showingPDF && pdfData && pdfData.length > 0
  $: console.log(
    'Reactive update: showingPDF=',
    showingPDF,
    'pdfData length=',
    pdfData?.length,
    'shouldShowPDFDocument=',
    shouldShowPDFDocument,
  )

  onMount(async () => {
    await fetchAllProjects()
    await fetchAllTaskDefinitions()

    // Set up event listeners for PDF export
    if (!eventListenersAdded && window.electron) {
      window.electron.on(
        'on-pdf-export-file-selected',
        (data: { canceled: boolean }) => {
          if (data.canceled) {
            // User canceled - go back to form
            pdfData = null
            showingPDF = false
            selectedPanel.set('PDFExport')
          }
          // If not canceled, keep PDFDocument visible - PDF generation will happen next
          // Don't switch back yet - wait for on-pdf-export-file-saved
        },
      )

      window.electron.on('on-pdf-export-file-saved', () => {
        // PDF saved successfully - NOW go back to form
        // This is called AFTER printToPDF completes, so PDFDocument was visible during capture
        pdfData = null
        showingPDF = false
        selectedPanel.set('PDFExport')
      })

      eventListenersAdded = true
    }
  })

  onDestroy(() => {
    // Cleanup would go here if needed
  })

  projects.subscribe(value => {
    allProjects = value
  })

  taskDefinitions.subscribe(value => {
    allTaskDefinitions = value
  })

  async function fetchAllProjects() {
    if (window.electron) {
      try {
        const data = await window.electron.getProjects()
        projects.set(data)
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }
  }

  async function fetchAllTaskDefinitions() {
    if (window.electron) {
      try {
        const data = await window.electron.getAllTaskDefinitions()
        taskDefinitions.set(data)
      } catch (error) {
        console.error('Error loading task definitions:', error)
      }
    }
  }

  function toggleTask(projectName: string, taskName: string) {
    const key = `${projectName}:${taskName}`
    const index = selectedTasks.findIndex(
      t => `${t.project_name}:${t.name}` === key,
    )
    if (index >= 0) {
      selectedTasks = selectedTasks.filter((_, i) => i !== index)
    } else {
      selectedTasks = [
        ...selectedTasks,
        { project_name: projectName, name: taskName },
      ]
    }
  }

  function isTaskSelected(projectName: string, taskName: string): boolean {
    return selectedTasks.some(
      t => t.project_name === projectName && t.name === taskName,
    )
  }

  async function handleGenerate(e: Event) {
    e.preventDefault()
    if (!formValid) return

    const query: PDFQuery = {
      from: fromDate,
      to: toDate,
      tasks: selectedTasks,
    }

    console.log('PDF Export query:', query)
    console.log('Selected tasks:', selectedTasks)

    if (window.electron) {
      try {
        const data = await window.electron.getDataForPDFExport(query)
        console.log('PDF data received:', data)
        console.log('PDF data length:', data?.length)

        if (!data || data.length === 0) {
          alert(
            'No tasks found for the selected criteria. Please check your date range and selected tasks.',
          )
          return
        }

        pdfData = data
        showingPDF = true
        console.log('Setting showingPDF to true, pdfData:', pdfData)
        console.log(
          'pdfData type:',
          typeof pdfData,
          'isArray:',
          Array.isArray(pdfData),
          'length:',
          pdfData?.length,
        )
        selectedPanel.set('PDFDocument')
        console.log(
          'Panel set to PDFDocument, current panel should be:',
          $selectedPanel,
        )
        // Force reactivity update
        await tick()
        console.log('After tick: showingPDF=', showingPDF, 'pdfData=', pdfData)
        // Wait for Svelte to render the PDFDocument component
        await tick()
        // Add a delay to ensure the component is fully rendered and visible
        await new Promise(resolve => setTimeout(resolve, 300))
        // Show file save dialog - PDFDocument will stay visible during this
        await window.electron.showFileSaveDialog()
        // Note: The view will switch back to form only after the save completes
        // (handled by event listeners above)
      } catch (error) {
        console.error('Error generating PDF:', error)
        // On error, reset state
        pdfData = null
        showingPDF = false
        selectedPanel.set('PDFExport')
      }
    }
  }

  function getTasksForProject(projectName: string): DBTaskDefinition[] {
    return allTaskDefinitions.filter(td => td.project_name === projectName)
  }
</script>

<!-- Debug: showingPDF={showingPDF}, pdfData={pdfData ? `[${pdfData.length} items]` : 'null'}, shouldShowPDFDocument={shouldShowPDFDocument} -->
{#if shouldShowPDFDocument}
  <PDFDocument pdfDocument={pdfData} />
{:else if showingPDF && pdfData && pdfData.length === 0}
  <div class="alert alert-warning">
    <span
      >No tasks found for the selected criteria. PDF view would show here if
      tasks were found.</span
    >
  </div>
{:else if allTaskDefinitions.length > 0}
  <section class="section">
    <h1 class="text-2xl font-bold">PDF Export</h1>
    <h2 class="text-lg text-base-content/70">
      You can export your saved projects and tasks as PDF.
    </h2>

    <form on:submit={handleGenerate} class="mt-4">
      <div class="grid grid-cols-3 gap-4">
        <!-- Date Range -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Date Range</h2>

            <div class="form-control">
              <label class="label">
                <span class="label-text">From</span>
              </label>
              <input
                type="date"
                bind:value={fromDate}
                class="input input-bordered"
                required
              />
            </div>

            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text">To</span>
              </label>
              <input
                type="date"
                bind:value={toDate}
                class="input input-bordered"
                required
              />
            </div>

            <div class="form-control mt-4">
              <button
                type="submit"
                class="btn"
                class:btn-primary={formValid}
                class:btn-error={!formValid}
                disabled={!formValid}
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <!-- Tasks Selection -->
        <div class="card bg-base-200 shadow-xl col-span-2">
          <div class="card-body">
            <h2 class="card-title">Tasks</h2>
            <div class="space-y-4">
              {#each allProjects as project}
                {@const projectTasks = getTasksForProject(project.name)}
                {#if projectTasks.length > 0}
                  <div class="card bg-base-100">
                    <div class="card-body">
                      <h3 class="card-title text-lg">{project.name}</h3>
                      <div class="space-y-2">
                        {#each projectTasks as taskDef}
                          <label
                            class="label cursor-pointer justify-start gap-2"
                          >
                            <input
                              type="checkbox"
                              class="checkbox"
                              checked={isTaskSelected(
                                project.name,
                                taskDef.name,
                              )}
                              on:change={() =>
                                toggleTask(project.name, taskDef.name)}
                            />
                            <span class="label-text">{taskDef.name}</span>
                          </label>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>
    </form>
  </section>
{:else}
  <div class="alert alert-info">
    <span>Loading task definitions...</span>
  </div>
{/if}
