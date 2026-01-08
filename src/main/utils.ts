import { is } from '@electron-toolkit/utils'
import { join } from 'path'

const ELECTRON_RENDERER_URL = process.env['ELECTRON_RENDERER_URL'] || null

export const loadWindowContents = (
  win: Electron.BrowserWindow,
  file: string,
): void => {
  if (is.dev && ELECTRON_RENDERER_URL) {
    win.loadURL(join(ELECTRON_RENDERER_URL, file))
  } else {
    const filePath = join(__dirname, '..', 'renderer', file)
    win.loadFile(filePath)
  }
}
