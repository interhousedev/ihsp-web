import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  apiUrl,
  problem,
  pushConfig,
  pushPublicKey,
  pushSubscriptions,
  renderWithProviders,
  resetPushSubscriptions,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { FakeRegistration, FakeSubscription, installPushApis, type InstalledPush } from "./fake-push"
import { applicationServerKey } from "./push-support"
import { PushToggle } from "./push-toggle"

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/device-1"
const KEY = applicationServerKey(pushPublicKey)

let installed: InstalledPush | null = null

function install(options?: Parameters<typeof installPushApis>[0]): InstalledPush {
  installed = installPushApis(options)
  return installed
}

beforeEach(() => resetPushSubscriptions())

afterEach(() => {
  installed?.restore()
  installed = null
})

function renderToggle(registration: FakeRegistration | null) {
  return renderWithProviders(
    <PushToggle getRegistration={async () => registration as unknown as ServiceWorkerRegistration | null} />,
  )
}

/** The base-ui switch is a span: it is disabled through `aria-disabled`, not the `disabled` attribute. */
function expectDisabled(control: HTMLElement) {
  expect(control).toHaveAttribute("aria-disabled", "true")
}

const toggle = () => screen.findByRole("switch", { name: "Push notifications on this device" })

describe("states that cannot be switched", () => {
  it("says so when the browser has no push support", async () => {
    renderToggle(null)

    expect(await screen.findByText("This browser cannot show push notifications.")).toBeInTheDocument()
    expectDisabled(await toggle())
  })

  it("asks an iPhone user in Safari to add the app to the Home Screen", async () => {
    install({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari" })
    delete (window as unknown as Record<string, unknown>).PushManager // a Safari tab has none

    renderToggle(null)

    expect(await screen.findByText(/add IHT to the Home Screen first/)).toBeInTheDocument()
    expectDisabled(await toggle())
  })

  it("points to the installed app where there is no service worker", async () => {
    install()

    renderToggle(null)

    expect(await screen.findByText(/Open the installed IHT app/)).toBeInTheDocument()
    expectDisabled(await toggle())
  })

  it("explains how to unblock notifications after the user denied them", async () => {
    install({ permission: "denied" })

    renderToggle(new FakeRegistration())

    expect(await screen.findByText(/Notifications are blocked for this site/)).toBeInTheDocument()
    expectDisabled(await toggle())
  })

  it("is unavailable while the server has no VAPID keys", async () => {
    install()
    server.use(http.get(apiUrl("/v1/push/config"), () => HttpResponse.json({ enabled: false, vapid_public_key: null })))

    renderToggle(new FakeRegistration())

    expect(await screen.findByText("Push notifications are not switched on on the server yet.")).toBeInTheDocument()
    expectDisabled(await toggle())
  })
})

describe("switching push on", () => {
  it("is off until the user turns it on", async () => {
    install()

    renderToggle(new FakeRegistration())

    expect(await screen.findByText(/Get your notifications on this device/)).toBeInTheDocument()
    const control = await toggle()
    expect(control).not.toHaveAttribute("aria-disabled", "true")
    expect(control).not.toBeChecked()
  })

  it("asks for permission, subscribes with the server key and registers the device", async () => {
    const browser = install()
    const registration = new FakeRegistration()
    const { user } = renderToggle(registration)

    await user.click(await toggle())

    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
    expect(registration.subscribeCalls).toHaveLength(1)
    expect(registration.subscribeCalls[0]?.userVisibleOnly).toBe(true)
    expect([...new Uint8Array(registration.subscribeCalls[0]?.applicationServerKey as ArrayBuffer)]).toEqual([...KEY])
    expect([...pushSubscriptions.keys()]).toEqual([ENDPOINT])
    expect(await screen.findByText(/This device gets your notifications/)).toBeInTheDocument()
  })

  it("sends the keys and the user agent to the server", async () => {
    install()
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/push-subscriptions"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ id: "sub-1" }, { status: 201 })
      }),
    )
    const { user } = renderToggle(new FakeRegistration())

    await user.click(await toggle())

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      endpoint: ENDPOINT,
      keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      user_agent: navigator.userAgent,
    })
  })

  it("stays off when the permission prompt is dismissed", async () => {
    install({ answer: "default" })
    const registration = new FakeRegistration()
    const { user } = renderToggle(registration)

    await user.click(await toggle())

    await waitFor(() => expect(screen.getByRole("switch")).not.toHaveAttribute("aria-disabled", "true"))
    expect(screen.getByRole("switch")).not.toBeChecked()
    expect(registration.subscribeCalls).toHaveLength(0)
    expect(pushSubscriptions.size).toBe(0)
  })

  it("shows the blocked state when the user denies the prompt", async () => {
    install({ answer: "denied" })
    const { user } = renderToggle(new FakeRegistration())

    await user.click(await toggle())

    expect(await screen.findByText(/Notifications are blocked for this site/)).toBeInTheDocument()
    expectDisabled(screen.getByRole("switch"))
  })

  it("drops the browser subscription again when the server refuses it", async () => {
    install()
    server.use(
      http.post(apiUrl("/v1/me/push-subscriptions"), () =>
        problem(422, "notify/invalid-push-subscription", "Invalid subscription"),
      ),
    )
    const registration = new FakeRegistration()
    const { user } = renderToggle(registration)

    await user.click(await toggle())

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not change push notifications on this device")
    expect(registration.current?.unsubscribed).toBe(true)
    expect(screen.getByRole("switch")).not.toBeChecked()
  })

  it("replaces a subscription that was made with an older server key", async () => {
    install()
    const stale = new FakeSubscription(ENDPOINT, new Uint8Array([9, 9, 9]))
    const registration = new FakeRegistration(stale)
    // `getSubscription` of the page shows the stale one as "on"; switching off and on must resubscribe with the new key
    const { user } = renderToggle(registration)
    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    await user.click(screen.getByRole("switch"))
    await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked())

    await user.click(screen.getByRole("switch"))

    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    expect(stale.unsubscribed).toBe(true)
    expect([...new Uint8Array(registration.subscribeCalls[0]?.applicationServerKey as ArrayBuffer)]).toEqual([...KEY])
  })
})

describe("a device that is already subscribed", () => {
  it("shows push as on and refreshes the server's copy of the subscription", async () => {
    install({ permission: "granted" })
    const subscription = new FakeSubscription(ENDPOINT, KEY)

    renderToggle(new FakeRegistration(subscription))

    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    await waitFor(() => expect([...pushSubscriptions.keys()]).toEqual([ENDPOINT]))
  })

  it("switching it off deletes the server's row and the browser subscription", async () => {
    install({ permission: "granted" })
    const subscription = new FakeSubscription(ENDPOINT, KEY)
    const { user } = renderToggle(new FakeRegistration(subscription))
    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    await waitFor(() => expect(pushSubscriptions.size).toBe(1))
    const deleted: unknown[] = []
    server.use(
      http.delete(apiUrl("/v1/me/push-subscriptions"), async ({ request }) => {
        deleted.push(await request.json())
        pushSubscriptions.clear()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await user.click(screen.getByRole("switch"))

    await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked())
    expect(deleted).toEqual([{ endpoint: ENDPOINT }])
    expect(subscription.unsubscribed).toBe(true)
    expect(pushSubscriptions.size).toBe(0)
  })

  it("still switches off in the browser when the server cannot be reached", async () => {
    install({ permission: "granted" })
    const subscription = new FakeSubscription(ENDPOINT, KEY)
    const { user } = renderToggle(new FakeRegistration(subscription))
    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked())
    server.use(http.delete(apiUrl("/v1/me/push-subscriptions"), () => HttpResponse.error()))

    await user.click(screen.getByRole("switch"))

    await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked())
    expect(subscription.unsubscribed).toBe(true)
  })
})

describe("without an injected registration", () => {
  it("falls back to navigator.serviceWorker.ready", async () => {
    install()
    const registration = new FakeRegistration()
    Object.defineProperty(window.navigator, "serviceWorker", {
      value: { ready: Promise.resolve(registration) },
      configurable: true,
    })

    renderWithProviders(<PushToggle />)

    expect(await screen.findByText(/Get your notifications on this device/)).toBeInTheDocument()
    expect(await toggle()).not.toHaveAttribute("aria-disabled", "true")
  })
})

it("serves the key from the test config", () => {
  expect(pushConfig.vapid_public_key).toBe(pushPublicKey)
})
