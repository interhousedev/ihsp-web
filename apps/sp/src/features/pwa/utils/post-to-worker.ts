import type { SwMessage } from "./sw-messages"

/**
 * Sends a message to the worker that controls this page, or to the active one when the page is not controlled yet (the
 * first visit). Does nothing without a worker. Safe to call while the page is being left: the controller is used at once.
 */
export function postToWorker(
  message: SwMessage,
  container: ServiceWorkerContainer | undefined = navigatorContainer(),
): void {
  if (!container) return
  // A ServiceWorker has no target origin argument (that is for windows).
  if (container.controller) {
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    container.controller.postMessage(message)
    return
  }
  container.ready
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    .then((registration) => registration.active?.postMessage(message))
    .catch(() => undefined)
}

function navigatorContainer(): ServiceWorkerContainer | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.serviceWorker
}
