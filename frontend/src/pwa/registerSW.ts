
import { Workbox } from 'workbox-window'

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/service-worker.js')
    wb.register().catch(console.error)
  }
}
