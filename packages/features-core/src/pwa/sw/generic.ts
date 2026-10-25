/**
 * The service worker entry of every installable app that has nothing app specific to cache: `lms`, `library`, `staff` and
 * `admin` bundle this file to their `public/sw.js` (`bun run build:sw`). Pages, scripts and styles are cached for offline
 * use and the offline page is shown; the API is never cached. The page says which app it is in the registration address
 * (`/sw.js?...&app=lms`), which names the caches.
 */
import { appIdFromSearch } from "./cache-keys"
import { runServiceWorker } from "./run-service-worker"

declare const self: { readonly location: Location }

runServiceWorker({ appId: appIdFromSearch(self.location.search), precachePages: ["/"] })
