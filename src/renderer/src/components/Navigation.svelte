<script lang="ts">
  import { Button } from '@ui/button'
  import { ArrowUpIcon } from '@lucide/svelte'
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

<div class="menu menu-horizontal bg-base-200 rounded-box w-full justify-around">
  <ul class="menu menu-horizontal bg-base-200 rounded-box justify-end">
    <li>
      <Button variant="outline"
        >Button
        <ArrowUpIcon />
      </Button>
      <button
        class="tab"
        class:tab-active={currentPanel === 'Overview'}
        onclick={() => handlePanelClick('Overview')}
      >
        <i class="fa-solid fa-chart-bar mr-2"></i>
        Overview
      </button>
    </li>
    <li>
      <button
        class="tab"
        class:tab-active={currentPanel === 'Search'}
        onclick={() => handlePanelClick('Search')}
      >
        <i class="fa-solid fa-magnifying-glass mr-2"></i>
        Search
      </button>
    </li>
    <li>
      <button
        class="tab"
        class:tab-active={currentPanel === 'PDFExport' ||
          currentPanel === 'PDFDocument'}
        onclick={() => handlePanelClick('PDFExport')}
      >
        <i class="fa-regular fa-file-pdf mr-2"></i>
        PDF Export
      </button>
    </li>
  </ul>
  <ul class="menu menu-horizontal bg-base-200 rounded-box justify-end">
    <li>
      <button
        class="btn btn-secondary"
        onclick={() => handleTopButtonClick('reportABug')}
      >
        <i class="fa-solid fa-bug"></i>
        <span>Report a bug</span>
      </button>
    </li>
    <li>
      <button
        class="btn btn-primary"
        onclick={() => handleTopButtonClick('seeTheCode')}
      >
        <i class="fa-solid fa-code"></i>
        <span>See the code</span>
      </button>
    </li>
  </ul>
</div>
