<script lang="ts">
  export let type: 'info' | 'warning' | 'error' | 'success' = 'info'
  export let title: string = ''

  $: alertClass = {
    info: 'alert-info',
    warning: 'alert-warning',
    error: 'alert-error',
    success: 'alert-success',
  }[type]
</script>

<div class="alert {alertClass}">
  {#if title}
    <span class="font-bold">{title}</span>
  {/if}
  <slot />
</div>
