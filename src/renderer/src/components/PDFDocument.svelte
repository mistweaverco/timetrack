<script lang="ts">
  import { getHMSStringFromSeconds } from '../lib/utils'

  export let pdfDocument: PDFQueryResult[]

  type PDFTotalObject = {
    [companyName: string]: {
      [projectName: string]: {
        [taskName: string]: number
      }
    }
  }

  $: total = (() => {
    const result: PDFTotalObject = {}
    pdfDocument.forEach((item: PDFQueryResult) => {
      if (!result[item.companyName]) {
        result[item.companyName] = {}
      }
      if (!result[item.companyName][item.projectName]) {
        result[item.companyName][item.projectName] = {}
      }
      if (!result[item.companyName][item.projectName][item.name]) {
        result[item.companyName][item.projectName][item.name] = 0
      }
      result[item.companyName][item.projectName][item.name] += item.seconds
    })
    return result
  })()
</script>

<div class="space-y-2">
  <!-- Tasks List -->
  {#each pdfDocument as item (item.id)}
    <div class="card shadow-xl border">
      <div class="card-body p-4">
        <h3 class="font-semibold text-xs">
          {item.companyName}
        </h3>
        <h2 class="card-title text-xl">{item.projectName}</h2>
        <p class="font-semibold text-base">{item.name}</p>
        {#if item.description}
          <div class="prose max-w-none markdown-content text-sm">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html item.description}
          </div>
        {/if}
        <div class="flex gap-4 mt-2 text-sm">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-calendar hidden"></i>
            <time datetime={item.date}>{item.date}</time>
          </div>
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-clock hidden"></i>
            <span>Time spent: {getHMSStringFromSeconds(item.seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  {/each}

  <!-- Total View -->
  <section class="hero rounded-lg p-4 mt-8">
    <div class="hero-content">
      <div>
        <h2 class="font-bold text-xl">Total Time</h2>
        <p class="mt-2 text-sm">
          Total time spent on projects and tasks combined.
        </p>
      </div>
    </div>
  </section>

  {#each Object.keys(total) as companyName (companyName)}
    <div class="card shadow-xl border">
      <div class="card-body p-4">
        <h2 class="card-title text-xl">{companyName}</h2>
        {#each Object.keys(total[companyName]) as projectName (projectName)}
          <div class="mt-4">
            <h3 class="font-semibold text-base mb-2">
              {projectName}
            </h3>
            <div class="space-y-2 text-sm ml-4">
              {#each Object.keys(total[companyName][projectName]) as taskName (taskName)}
                <div class="flex justify-between items-center">
                  <span class="font-semibold">{taskName}</span>
                  <span class="badge badge-primary badge-sm text-base">
                    {getHMSStringFromSeconds(
                      total[companyName][projectName][taskName],
                    )}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <!-- Powered by header -->
  <section class="hero rounded-lg p-4">
    <div class="hero-content text-center">
      <div>
        <h1 class="font-bold text-sm">
          Generated with ♥️ <a href="https://timetrack.mwco.app">timetrack</a>
        </h1>
      </div>
    </div>
  </section>
</div>
