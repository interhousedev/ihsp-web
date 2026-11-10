/** Entrance devices (admin): list, one-time token, revoke, calls of the last 7 days; entrance photo of a student. */
import { describe, expect, test } from "bun:test"
import { screen, waitFor, within } from "@testing-library/react"
import { DevicesPage } from "../features/devices/components/devices-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("devices page", () => {
  test("DEV-ADM-01 lists devices with their state and last use", async () => {
    renderAdmin(<DevicesPage />, { route: "/devices/" })

    const list = await screen.findByRole("list", { name: "Entrance devices" })
    expect(within(list).getByText("Main entrance")).toBeInTheDocument()
    expect(within(list).getByText("Active")).toBeInTheDocument()
    expect(within(list).getByText("Revoked")).toBeInTheDocument()
  })

  test("DEV-ADM-02 shows the token once after creating, with a copy button", async () => {
    const { user } = renderAdmin(<DevicesPage />, { route: "/devices/" })
    await screen.findByText("Main entrance")

    await user.click(screen.getByRole("button", { name: "Add device" }))
    const form = await screen.findByRole("dialog", { name: "New device" })
    await user.type(within(form).getByLabelText("Name"), "Side door")
    await user.click(within(form).getByRole("button", { name: "Create" }))

    const token = await screen.findByRole("dialog", { name: "Token of Side door" })
    expect(within(token).getByText("ihd_secret-token-shown-once")).toBeInTheDocument()
    expect(within(token).getByRole("button", { name: "Copy" })).toBeInTheDocument()

    await user.click(within(token).getByRole("button", { name: "I copied it" }))
    await waitFor(() => expect(screen.queryByText("ihd_secret-token-shown-once")).not.toBeInTheDocument())
    expect(await screen.findByText("Side door")).toBeInTheDocument()
  })

  test("DEV-ADM-03 revokes a device after confirmation", async () => {
    const { user } = renderAdmin(<DevicesPage />, { route: "/devices/" })
    await user.click(await screen.findByRole("button", { name: "Revoke Main entrance" }))
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Revoke" }))

    await waitFor(() => expect(screen.queryByRole("button", { name: "Revoke Main entrance" })).not.toBeInTheDocument())
    expect(screen.getAllByText("Revoked")).toHaveLength(2)
  })

  test("DEV-ADM-04 shows the calls of the last 7 days", async () => {
    const { user } = renderAdmin(<DevicesPage />, { route: "/devices/" })
    await user.click(await screen.findByRole("button", { name: "Calls of Main entrance" }))

    const dialog = await screen.findByRole("dialog", { name: "Calls of Main entrance" })
    expect(await within(dialog).findByText("Aliyev Ali")).toBeInTheDocument()
    expect(within(dialog).getByText("Nobody recognised")).toBeInTheDocument()
  })

  test("DEV-ADM-05 a device without calls says so", async () => {
    const { user } = renderAdmin(<DevicesPage />, { route: "/devices/" })
    await user.click(await screen.findByRole("button", { name: "Calls of Old gate" }))

    expect(await screen.findByText("No calls in the last 7 days.")).toBeInTheDocument()
  })
})
