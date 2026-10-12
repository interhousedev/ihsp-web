/**
 * The messages between the page and the service worker. They live in `@ihsp/features-core/pwa/sw` now (every
 * installable app shares them); the student app's imports keep working.
 */
export {
  SW_EVENT,
  SW_MESSAGE,
  parseSwEvent,
  parseSwMessage,
  type SwEvent,
  type SwMessage,
} from "@ihsp/features-core/pwa/sw"
