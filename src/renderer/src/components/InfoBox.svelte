<script lang="ts">
  export let type: 'info' | 'warning' | 'error' | 'success' = 'info'
  export let title: string = ''

  $: alertBgClass = {
    info: 'bg-info',
    warning: 'bg-warning',
    error: 'bg-error',
    success: 'bg-success',
  }[type]
  $: alertContentClass = {
    info: 'text-info-content',
    warning: 'text-warning-content',
    error: 'text-error-content',
    success: 'text-success-content',
  }[type]
</script>

<div class="card card-bordered {alertBgClass}">
  <div class="card-body">
    {#if title}
      <h2 class="card-title {alertContentClass}">{title}</h2>
    {/if}
    <div class="card-content {alertContentClass}">
      <slot />
    </div>
  </div>
</div>
