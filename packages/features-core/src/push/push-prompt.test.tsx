import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { apiUrl, pushSubscriptions, renderWithProviders, resetPushSubscriptions, server } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { FakeRegistration, installPushApis, type InstalledPush } from "./fake-push"
import { ASK_SNOOZE_MS, PUSH_PROMPT_STORAGE_KEY, PushPrompt, pushPromptKind } from "./push-prompt"

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari"

let installed: InstalledPush | null = null

function install(options?: Parameters<typeof installPushApis>[0]): InstalledPush {
  installed = installPushApis(options)
  return installed
}

beforeEach(() => {
  resetPushSubscriptions()
  window.localStorage.removeItem(PUSH_PROMPT_STORAGE_KEY)
})

afterEach(() => {
  installed?.restore()
  installed = null
})

function renderPrompt(registration: FakeRegistration | null) {
  return renderWithProviders(
    <PushPrompt getRegistration={async () => registration as unknown as ServiceWorkerRegistration | null} />,
  )
}

describe("pushPromptKind", () => {
  const base = { status: "off", permission: "default", serverEnabled: true, snoozedUntil: 0, now: 1000 } as const

  it("asks when the app can subscribe and the user was never asked", () => {
    expect(pushPromptKind(base)).toBe("ask")
  })

  it("stays away once permission was answered, the server is off, or it was snoozed", () => {
    expect(pushPromptKind({ ...base, permission: "granted" })).toBeNull()
    expect(pushPromptKind({ ...base, permission: "denied", status: "denied" })).toBeNull()
    expect(pushPromptKind({ ...base, serverEnabled: false })).toBeNull()
    expect(pushPromptKind({ ...base, snoozedUntil: 2000 })).toBeNull()
    expect(pushPromptKind({ ...base, status: "on" })).toBeNull()
  })

  it("explains the Home Screen on an iPhone in Safari", () => {
    expect(pushPromptKind({ ...base, status: "ios-install", permission: null })).toBe("install")
  })
})

describe("PushPrompt", () => {
  it("Allow asks for permission, subscribes and registers the device", async () => {
    const browser = install()
    const registration = new FakeRegistration()
    const { user } = renderPrompt(registration)

    await user.click(await screen.findByRole("button", { name: "Allow" }))

    await waitFor(() => expect([...pushSubscriptions.keys()]).toHaveLength(1))
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
    expect(registration.subscribeCalls).toHaveLength(1)
    await waitFor(() => expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument())
  })

  it("Not now hides it and remembers that for days", async () => {
    const browser = install()
    const { user } = renderPrompt(new FakeRegistration())

    await user.click(await screen.findByRole("button", { name: "Not now" }))

    await waitFor(() => expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument())
    expect(browser.requestPermission).not.toHaveBeenCalled()
    const until = Number(window.localStorage.getItem(PUSH_PROMPT_STORAGE_KEY))
    expect(until).toBeGreaterThan(Date.now() + ASK_SNOOZE_MS - 60_000)
  })

  it("is not shown after the user already answered", async () => {
    install({ permission: "granted" })
    renderPrompt(new FakeRegistration())

    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument()
  })

  it("is not shown while the server has no VAPID keys", async () => {
    install()
    server.use(http.get(apiUrl("/v1/push/config"), () => HttpResponse.json({ enabled: false, vapid_public_key: null })))
    renderPrompt(new FakeRegistration())

    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument()
  })

  it("tells an iPhone user in Safari to add the app to the Home Screen", async () => {
    install({ userAgent: IPHONE })
    delete (window as unknown as Record<string, unknown>).PushManager
    renderPrompt(null)

    expect(await screen.findByText("Notifications need the app")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument()
  })
})
