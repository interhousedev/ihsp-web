/**
 * The service worker of the installable student app (`app.ihsu.uz`). `bun run build:sw` bundles it to `public/sw.js`; the
 * page registers it only in pwa mode. The worker itself is shared with the other installable apps
 * (`runServiceWorker` in `@ihsp/features-core/pwa/sw`); this entry gives it what is specific to the student app: the pages
 * to precache and the API answers to keep for offline use (today, timetable, homework, grades), see `cache-keys.ts`.
 */
import { runServiceWorker } from "@ihsp/features-core/pwa/sw"
import { PRECACHE_PAGES, SWR_API_PATHS } from "./cache-keys"

runServiceWorker({ appId: "sp", precachePages: PRECACHE_PAGES, swrApiPaths: SWR_API_PATHS })
