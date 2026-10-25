import { describe, expect, it } from "bun:test"
import {
  applicationServerKey,
  evaluatePushEnvironment,
  usesKey,
  waitForRegistration,
  type PushEnvironmentInput,
} from "./push-support"

const CHROME: PushEnvironmentInput = {
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36",
  platform: "Linux x86_64",
  maxTouchPoints: 0,
  standalone: false,
  hasServiceWorker: true,
  hasPushManager: true,
  hasNotification: true,
}

const IPHONE_SAFARI: PushEnvironmentInput = {
  ...CHROME,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile Safari",
  platform: "iPhone",
  maxTouchPoints: 5,
  hasPushManager: false, // not in a Safari tab, only in an installed web app
}

describe("evaluatePushEnvironment", () => {
  it("accepts a browser with service workers, the Push API and notifications", () => {
    expect(evaluatePushEnvironment(CHROME)).toEqual({ supported: true, needsInstall: false })
  })

  it.each([
    ["service workers", { hasServiceWorker: false }],
    ["the Push API", { hasPushManager: false }],
    ["notifications", { hasNotification: false }],
  ])("is unsupported without %s", (_name, missing) => {
    expect(evaluatePushEnvironment({ ...CHROME, ...missing })).toEqual({ supported: false, needsInstall: false })
  })

  it("asks an iPhone in a Safari tab to install the app instead of calling it unsupported", () => {
    expect(evaluatePushEnvironment(IPHONE_SAFARI)).toEqual({ supported: false, needsInstall: true })
  })

  it("recognises iPadOS, which reports itself as a Mac with a touch screen", () => {
    const ipad = {
      ...IPHONE_SAFARI,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari",
      platform: "MacIntel",
    }

    expect(evaluatePushEnvironment(ipad).needsInstall).toBe(true)
    expect(evaluatePushEnvironment({ ...ipad, maxTouchPoints: 0 }).needsInstall).toBe(false)
  })

  it("supports an iPhone once the app runs from the Home Screen", () => {
    const installed = { ...IPHONE_SAFARI, standalone: true, hasPushManager: true }

    expect(evaluatePushEnvironment(installed)).toEqual({ supported: true, needsInstall: false })
  })
})

describe("applicationServerKey", () => {
  it("decodes a base64url VAPID key into its 65 bytes", () => {
    const key = "BF-9bFMfqAmQ6TYgBFjiw6BHjB3d6nyMeSywyUqzS77qWp3V-4IJIN3SoSVtwUwXPYwZIi8IkIOHR1tYM88DUxk"

    const bytes = applicationServerKey(key)

    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(4)
  })

  it("handles the url-safe alphabet and missing padding", () => {
    expect([...applicationServerKey("-_8")]).toEqual([251, 255])
  })
})

const subscriptionWith = (applicationServerKey: ArrayBuffer | null) =>
  ({ options: { applicationServerKey } }) as unknown as PushSubscription

describe("usesKey", () => {
  const key = new Uint8Array([1, 2, 3])
  it("compares the key a subscription was made with", () => {
    expect(usesKey(subscriptionWith(new Uint8Array([1, 2, 3]).buffer), key)).toBe(true)
    expect(usesKey(subscriptionWith(new Uint8Array([1, 2, 4]).buffer), key)).toBe(false)
    expect(usesKey(subscriptionWith(new Uint8Array([1, 2]).buffer), key)).toBe(false)
    expect(usesKey(subscriptionWith(null), key)).toBe(false)
  })
})

describe("waitForRegistration", () => {
  const registration = { scope: "/" } as ServiceWorkerRegistration

  it("returns the registration of navigator.serviceWorker.ready", async () => {
    expect(await waitForRegistration({ ready: Promise.resolve(registration) }, 50)).toBe(registration)
  })

  it("gives up when no worker is ever registered (ready never settles)", async () => {
    expect(await waitForRegistration({ ready: new Promise(() => undefined) }, 20)).toBeNull()
  })

  it("is null without service worker support", async () => {
    expect(await waitForRegistration(undefined, 20)).toBeNull()
  })
})
