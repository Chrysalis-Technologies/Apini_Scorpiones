import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const navigationHandler = new NetworkFirst({
  cacheName: 'hive-shell',
})

const navigationRoute = new NavigationRoute(navigationHandler, {
  allowlist: [new RegExp('/anchor/.*'), new RegExp('/zones/.*')],
})

registerRoute(navigationRoute)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'hive-api',
    networkTimeoutSeconds: 4,
  }),
)
