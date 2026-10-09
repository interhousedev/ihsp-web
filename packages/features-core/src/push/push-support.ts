/** What this device can do about Web Push, read from the browser (pure functions plus one reader). */

export type PushEnvironmentInput = {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
  /** The page runs as an installed app (home screen icon), not in a browser tab. */
  standalone: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  hasNotification: boolean
}

export type PushEnvironment = {
  /** Service workers, the Push API and notifications are all there. */
  supported: boolean
  /** An iPhone or iPad in a Safari tab: push works only after the app is added to the Home Screen. */
  needsInstall: boolean
}

/** iPhone, iPad and iPod, and iPadOS, which calls itself a Mac with a touch screen. */
export function isIosDevice({ userAgent, platform = "", maxTouchPoints = 0 }: PushEnvironmentInput): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true
  return platform === "MacIntel" && maxTouchPoints > 1
}

/** iOS first: a Safari tab has no `PushManager` there, so "unsupported" would hide the real reason. */
export function evaluatePushEnvironment(input: PushEnvironmentInput): PushEnvironment {
  if (isIosDevice(input) && !input.standalone) return { supported: false, needsInstall: true }
  return {
    supported: input.hasServiceWorker && input.hasPushManager && input.hasNotification,
    needsInstall: false,
  }
}

const NOT_SUPPORTED: PushEnvironment = { supported: false, needsInstall: false }

const DISPLAY_MODES = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"]

function isStandalone(): boolean {
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
  if (typeof window.matchMedia !== "function") return false
  return DISPLAY_MODES.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)
}

/** Reads the browser; during prerendering (no `window`) nothing is supported. */
export function readPushEnvironment(): PushEnvironment {
  if (typeof window === "undefined" || typeof navigator === "undefined") return NOT_SUPPORTED
  return evaluatePushEnvironment({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: isStandalone(),
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
  })
}

/** The VAPID public key (base64url) as the bytes `pushManager.subscribe` wants. */
export function applicationServerKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(base64Url.length / 4) * 4, "=")
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

/** True when a subscription was made with this key (a rotated server key makes `subscribe` throw). */
export function usesKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options?.applicationServerKey
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === key.length && bytes.every((value, index) => value === key[index])
}

/** How long to wait for `navigator.serviceWorker.ready` before concluding that no worker is registered. */
export const READY_TIMEOUT_MS = 2000

/**
 * The registration to use when the app does not hand one in: `navigator.serviceWorker.ready`. That promise never
 * resolves while nothing is registered (the portal, `next dev`), so it is raced against a timeout.
 */
export async function waitForRegistration(
  container: Pick<ServiceWorkerContainer, "ready"> | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator.serviceWorker,
  timeoutMs: number = READY_TIMEOUT_MS,
): Promise<ServiceWorkerRegistration | null> {
  if (!container) return null
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })
  try {
    return await Promise.race([container.ready, timeout])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
