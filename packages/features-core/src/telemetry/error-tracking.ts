import * as Sentry from "@sentry/browser"

/** The init options that matter for privacy: no PII, no user, no tracing, no replay, no input values. */
export const ERROR_TRACKING_OPTIONS = {
  sendDefaultPii: false,
  autoSessionTracking: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 30,
}

type Event = Sentry.ErrorEvent
type Breadcrumb = Sentry.Breadcrumb

/** Drops cookies, headers, the user and the IP address from an event before it is sent. */
export function scrubEvent(event: Event): Event {
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
  }
  delete event.user
  return event
}

/** UI breadcrumbs (clicks and input changes) can carry what the user typed, so none are kept. */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return breadcrumb.category?.startsWith("ui.") ? null : breadcrumb
}

/** The DSN from the build (`NEXT_PUBLIC_BUGSINK_DSN`); empty or missing means no error tracking. */
export function readBugsinkDsn(): string | undefined {
  const dsn = process.env.NEXT_PUBLIC_BUGSINK_DSN?.trim()
  return dsn ? dsn : undefined
}

export type InitFn = (options: Sentry.BrowserOptions) => void

/**
 * Starts the Sentry-compatible client (Bugsink) when a DSN is configured, and does nothing otherwise.
 * Returns whether the client was started. `init` is injected for tests; the apps use the default.
 */
export function initErrorTracking(dsn: string | undefined, init: InitFn = Sentry.init): boolean {
  if (!dsn) return false
  init({
    ...ERROR_TRACKING_OPTIONS,
    dsn,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  })
  return true
}
