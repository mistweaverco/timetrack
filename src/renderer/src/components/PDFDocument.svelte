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

<div class="space-y-4 print:space-y-2">
  <!-- Header -->
  <section class="hero bg-base-200 rounded-lg p-8 print:p-4 print:bg-white">
    <div class="hero-content text-center">
      <div>
        <h1 class="text-4xl font-bold print:text-2xl">
          <a href="https://timetrack.mwco.app">timetrack</a>
        </h1>
      </div>
    </div>
  </section>

  <!-- Tasks List -->
  {#each pdfDocument as item (`${item.companyName}-${item.projectName}-${item.name}-${item.date}`)}
    <div
      class="card bg-base-200 shadow-xl print:bg-white print:shadow-none print:border print:border-gray-300"
    >
      <div class="card-body print:p-4">
        <h3 class="text-sm font-semibold text-base-content/70 print:text-xs">
          {item.companyName}
        </h3>
        <h2 class="card-title print:text-xl">{item.projectName}</h2>
        <p class="text-lg font-semibold print:text-base">{item.name}</p>
        {#if item.description}
          <div class="prose max-w-none print:text-sm">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html item.description}
          </div>
        {/if}
        <div class="flex gap-4 mt-2 print:text-sm">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-calendar print:hidden"></i>
            <time datetime={item.date}>{item.date}</time>
          </div>
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-clock print:hidden"></i>
            <span>Time spent: {getHMSStringFromSeconds(item.seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  {/each}

  <!-- Total View -->
  <section
    class="hero bg-base-200 rounded-lg p-8 print:p-4 print:bg-white print:mt-8"
  >
    <div class="hero-content">
      <div>
        <h2 class="text-3xl font-bold print:text-xl">Total Time</h2>
        <p class="text-lg mt-2 print:text-sm">
          Total time spent on projects and tasks combined.
        </p>
      </div>
    </div>
  </section>

  {#each Object.keys(total) as companyName (companyName)}
    <div
      class="card bg-base-200 shadow-xl print:bg-white print:shadow-none print:border print:border-gray-300"
    >
      <div class="card-body print:p-4">
        <h2 class="card-title print:text-xl">{companyName}</h2>
        {#each Object.keys(total[companyName]) as projectName (projectName)}
          <div class="mt-4">
            <h3 class="text-lg font-semibold print:text-base mb-2">
              {projectName}
            </h3>
            <div class="space-y-2 print:text-sm ml-4">
              {#each Object.keys(total[companyName][projectName]) as taskName (taskName)}
                <div class="flex justify-between items-center">
                  <span class="font-semibold">{taskName}</span>
                  <span
                    class="badge badge-primary badge-lg print:badge-sm print:bg-gray-200 print:text-gray-800"
                  >
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
</div>
