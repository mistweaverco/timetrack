<script lang="ts">
  import { selectedPanel } from '../stores'

  export let currentPanel: string = 'Overview'
  export let onPanelChange: ((panel: string) => void) | undefined = undefined

  function handlePanelClick(panel: string) {
    selectedPanel.set(panel)
    if (onPanelChange) {
      onPanelChange(panel)
    }
  }

  function handleTopButtonClick(action: string) {
    switch (action) {
      case 'reportABug':
        window.open('https://github.com/mistweaverco/timetrack/issues/new')
        break
      case 'seeTheCode':
        window.open('https://github.com/mistweaverco/timetrack')
        break
    }
  }
</script>

<nav class="navbar bg-base-200">
  <div class="navbar-start"></div>
  <div class="navbar-end">
    <div class="navbar-item">
      <div class="flex gap-2">
        <button
          class="btn btn-secondary"
          onclick={() => handleTopButtonClick('reportABug')}
        >
          <i class="fa-solid fa-bug"></i>
          <span>Report a bug</span>
        </button>
        <button
          class="btn btn-primary"
          onclick={() => handleTopButtonClick('seeTheCode')}
        >
          <i class="fa-solid fa-code"></i>
          <span>See the code</span>
        </button>
      </div>
    </div>
  </div>
</nav>

<div class="tabs tabs-boxed m-4">
  <a
    class="tab"
    class:tab-active={currentPanel === 'Overview'}
    onclick={() => handlePanelClick('Overview')}
  >
    <i class="fa-solid fa-chart-bar mr-2"></i>
    Overview
  </a>
  <a
    class="tab"
    class:tab-active={currentPanel === 'Search'}
    onclick={() => handlePanelClick('Search')}
  >
    <i class="fa-solid fa-magnifying-glass mr-2"></i>
    Search
  </a>
  <a
    class="tab"
    class:tab-active={currentPanel === 'PDFExport' ||
      currentPanel === 'PDFDocument'}
    onclick={() => handlePanelClick('PDFExport')}
  >
    <i class="fa-regular fa-file-pdf mr-2"></i>
    PDF Export
  </a>
</div>
