<script lang="ts">
  import { getHMSStringFromSeconds } from '../lib/utils'

  export let pdfDocument: PDFQueryResult[]

  type PDFTotalObject = {
    [key: string]: {
      [key: string]: number
    }
  }

  $: total = (() => {
    const result: PDFTotalObject = {}
    pdfDocument.forEach((item: PDFQueryResult) => {
      if (!result[item.project_name]) {
        result[item.project_name] = {}
      }
      if (!result[item.project_name][item.name]) {
        result[item.project_name][item.name] = 0
      }
      result[item.project_name][item.name] += item.seconds
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
  {#each pdfDocument as item}
    <div
      class="card bg-base-200 shadow-xl print:bg-white print:shadow-none print:border print:border-gray-300"
    >
      <div class="card-body print:p-4">
        <h2 class="card-title print:text-xl">{item.project_name}</h2>
        <p class="text-lg font-semibold print:text-base">{item.name}</p>
        {#if item.description}
          <div class="prose max-w-none print:text-sm">
            <p>{item.description}</p>
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

  {#each Object.keys(total) as projectName}
    <div
      class="card bg-base-200 shadow-xl print:bg-white print:shadow-none print:border print:border-gray-300"
    >
      <div class="card-body print:p-4">
        <h2 class="card-title print:text-xl">{projectName}</h2>
        <div class="space-y-2 print:text-sm">
          {#each Object.keys(total[projectName]) as taskName}
            <div class="flex justify-between items-center">
              <span class="font-semibold">{taskName}</span>
              <span
                class="badge badge-primary badge-lg print:badge-sm print:bg-gray-200 print:text-gray-800"
              >
                {getHMSStringFromSeconds(total[projectName][taskName])}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/each}
</div>
