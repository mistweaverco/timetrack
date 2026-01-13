<script lang="ts">
  import { buttonVariants } from '@ui/button'
  import * as Tooltip from '@ui/tooltip'
  import { House, Search, Download, Bug, Code } from '@lucide/svelte'
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

<div class="flex justify-between p-4">
  <ul class="flex space-x-2">
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => handlePanelClick('Overview')}
            class={buttonVariants({
              variant: currentPanel === 'Overview' ? 'default' : 'outline',
            })}><House size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>Home</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => handlePanelClick('Search')}
            class={buttonVariants({
              variant: currentPanel === 'Search' ? 'default' : 'outline',
            })}><Search size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>Search</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => handlePanelClick('PDFExport')}
            class={buttonVariants({
              variant: currentPanel === 'PDFExport' ? 'default' : 'outline',
            })}><Download size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>Export</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
  </ul>
  <ul class="flex space-x-2">
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => handleTopButtonClick('reportABug')}
            class={buttonVariants({ variant: 'outline' })}
            ><Bug size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>Report a bug</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
    <li>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => handleTopButtonClick('seeTheCode')}
            class={buttonVariants({
              variant: 'outline',
            })}><Code size="16" /></Tooltip.Trigger
          >
          <Tooltip.Content>
            <p>See the code</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </li>
  </ul>
</div>
