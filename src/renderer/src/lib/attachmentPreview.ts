export const isPreviewableMimeType = (mimeType: string): boolean => {
  if (
    mimeType.startsWith('text/') ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('video/')
  ) {
    return true
  }
  return (
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/javascript'
  )
}

export const isTextPreviewMimeType = (mimeType: string): boolean => {
  if (mimeType.startsWith('text/')) return true
  return (
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript'
  )
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
