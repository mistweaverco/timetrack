import type { API } from './index'

declare global {
  interface Window {
    electron: typeof API
  }
}
