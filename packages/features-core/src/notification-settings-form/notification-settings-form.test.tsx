import { afterEach, describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { FakeRegistration, installPushApis, type InstalledPush } from "../push/fake-push"
import { NotificationSettingsForm } from "./notification-settings-form"

let installed: InstalledPush | null = null

afterEach(() => {
  installed?.restore()
  installed = null
})

describe("push notifications on this device", () => {
  it("is a section of the form with the switch and its reason", async () => {
    renderWithProviders(<NotificationSettingsForm roles={["student"]} />)

    expect(await screen.findByRole("heading", { name: "Push notifications" })).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Push notifications on this device" })).toBeInTheDocument()
    expect(await screen.findByText("This browser cannot show push notifications.")).toBeInTheDocument()
  })

  it("is shown for teachers and admins too", async () => {
    renderWithProviders(<NotificationSettingsForm roles={["admin"]} />)

    expect(await screen.findByRole("switch", { name: "Push notifications on this device" })).toBeInTheDocument()
  })

  it("uses the registration the app hands in", async () => {
    installed = installPushApis()
    const registration = new FakeRegistration()
    renderWithProviders(
      <NotificationSettingsForm
        roles={["student"]}
        getPushRegistration={async () => registration as unknown as ServiceWorkerRegistration}
      />,
    )

    await waitFor(() => expect(screen.getByText(/Get your notifications on this device/)).toBeInTheDocument())
    expect(screen.getByRole("switch", { name: "Push notifications on this device" })).not.toBeChecked()
  })

  it("can be left out by apps without a service worker", () => {
    renderWithProviders(<NotificationSettingsForm roles={["student"]} showPush={false} />)

    expect(screen.queryByRole("heading", { name: "Push notifications" })).not.toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: "Push notifications on this device" })).not.toBeInTheDocument()
  })

  it("is described in Russian and Uzbek as well", async () => {
    const { unmount } = renderWithProviders(<NotificationSettingsForm roles={["student"]} />, { locale: "ru" })
    expect(await screen.findByRole("heading", { name: "Push-уведомления" })).toBeInTheDocument()
    unmount()

    renderWithProviders(<NotificationSettingsForm roles={["student"]} />, { locale: "uz" })
    expect(await screen.findByRole("heading", { name: "Push-bildirishnomalar" })).toBeInTheDocument()
  })
})
