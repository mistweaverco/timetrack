<script lang="ts">
  import { isTextPreviewMimeType } from '../../lib/attachmentPreview'

  let { attachment, onClose } = $props<{
    attachment: DBTaskAttachmentData
    onClose: () => void
  }>()

  const dataUrl = $derived(
    `data:${attachment.mimeType};base64,${attachment.dataBase64}`,
  )

  const textContent = $derived.by(() => {
    if (!isTextPreviewMimeType(attachment.mimeType)) return ''
    try {
      const binary = atob(attachment.dataBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch {
      return '(Unable to decode text content)'
    }
  })
</script>

<div class="modal modal-open">
  <div class="modal-box max-w-4xl w-11/12">
    <h3 class="font-bold text-lg break-all">{attachment.filename}</h3>
    <p class="text-sm opacity-70 mb-4">{attachment.mimeType}</p>

    {#if isTextPreviewMimeType(attachment.mimeType)}
      <pre
        class="bg-base-200 p-4 rounded max-h-[60vh] overflow-auto text-sm whitespace-pre-wrap break-words">{textContent}</pre>
    {:else if attachment.mimeType.startsWith('image/')}
      <div class="flex justify-center max-h-[60vh] overflow-auto">
        <img
          src={dataUrl}
          alt={attachment.filename}
          class="max-w-full max-h-[60vh] object-contain"
        />
      </div>
    {:else if attachment.mimeType === 'application/pdf'}
      <iframe
        title={attachment.filename}
        src={dataUrl}
        class="w-full h-[60vh] rounded border border-base-300"
      ></iframe>
    {:else if attachment.mimeType.startsWith('audio/')}
      <audio controls src={dataUrl} class="w-full"></audio>
    {:else if attachment.mimeType.startsWith('video/')}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video controls src={dataUrl} class="w-full max-h-[60vh] rounded"></video>
    {:else}
      <p>This file type cannot be previewed inline.</p>
    {/if}

    <div class="modal-action">
      <button type="button" class="btn" onclick={onClose}>Close</button>
    </div>
  </div>
  <div
    class="modal-backdrop"
    onkeypress={(evt: KeyboardEvent) => evt.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
    onclick={onClose}
  ></div>
</div>
