import path from 'path'

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/plain',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.log': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
}

export const mimeTypeFromFilename = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase()
  return EXTENSION_MIME_MAP[ext] || 'application/octet-stream'
}

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
