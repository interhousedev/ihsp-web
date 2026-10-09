import { mock } from "bun:test"

type Listener = { applicationServerKey: ArrayBuffer }

/** A browser push subscription that remembers how it was made. */
export class FakeSubscription {
  unsubscribed = false
  constructor(
    readonly endpoint: string,
    private readonly key: Uint8Array,
  ) {}

  get options(): Listener {
    return { applicationServerKey: new Uint8Array(this.key).buffer }
  }

  toJSON() {
    return { endpoint: this.endpoint, keys: { p256dh: "p256dh-key", auth: "auth-secret" } }
  }

  unsubscribe = mock(async () => {
    this.unsubscribed = true
    return true
  })
}

/** A service worker registration with a working `pushManager`. */
export class FakeRegistration {
  current: FakeSubscription | null
  subscribeCalls: PushSubscriptionOptionsInit[] = []

  constructor(existing: FakeSubscription | null = null) {
    this.current = existing
  }

  pushManager = {
    getSubscription: async () => (this.current?.unsubscribed ? null : this.current),
    subscribe: mock(async (options: PushSubscriptionOptionsInit) => {
      this.subscribeCalls.push(options)
      this.current = new FakeSubscription(
        "https://fcm.googleapis.com/fcm/send/device-1",
        new Uint8Array(options.applicationServerKey as ArrayBuffer),
      )
      return this.current
    }),
  }
}

type Restore = () => void

function define(target: object, name: string, value: unknown): Restore {
  const before = Object.getOwnPropertyDescriptor(target, name)
  Object.defineProperty(target, name, { value, configurable: true, writable: true })
  return () => {
    if (before) Object.defineProperty(target, name, before)
    else delete (target as Record<string, unknown>)[name]
  }
}

export type InstalledPush = {
  requestPermission: ReturnType<typeof mock>
  restore: () => void
}

/**
 * Puts the browser APIs Web Push needs on `window`: `PushManager`, `Notification` (with a permission and the answer
 * to `requestPermission`) and `navigator.serviceWorker`. Call `restore()` in `afterEach`.
 */
export function installPushApis(
  options: { permission?: NotificationPermission; answer?: NotificationPermission; userAgent?: string } = {},
): InstalledPush {
  const { permission = "default", answer = "granted", userAgent } = options
  const restores: Restore[] = []
  const notification = { permission, requestPermission: mock(async () => answer) }
  restores.push(
    define(
      window,
      "PushManager",
      class PushManagerStub {
        readonly stub = true
      },
    ),
  )
  restores.push(define(window, "Notification", notification))
  restores.push(define(window.navigator, "serviceWorker", {}))
  if (userAgent) restores.push(define(window.navigator, "userAgent", userAgent))
  return {
    requestPermission: notification.requestPermission,
    restore: () => restores.toReversed().forEach((restore) => restore()),
  }
}
