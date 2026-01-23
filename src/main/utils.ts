import { is } from '@electron-toolkit/utils'
import { join } from 'path'

const ELECTRON_RENDERER_URL = process.env['ELECTRON_RENDERER_URL'] || null

export const loadWindowContents = async (
  win: Electron.BrowserWindow,
  file: string,
): Promise<void> => {
  if (is.dev && ELECTRON_RENDERER_URL) {
    await win.loadURL(join(ELECTRON_RENDERER_URL, file))
  } else {
    const filePath = join(__dirname, '..', 'renderer', file)
    await win.loadFile(filePath)
  }
}
