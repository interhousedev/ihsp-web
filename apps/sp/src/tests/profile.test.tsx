/** WEB-28, UF-WEB-16: the profile page. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, studentProfile } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ProfilePage } from "../features/profile/components/profile-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("profile page", () => {
  test("shows name, login, mailbox, group, subgroup, curator and head student", async () => {
    renderSp(<ProfilePage />, { route: "/profile/" })

    const account = (await screen.findByText("Account")).closest("section") as HTMLElement

    // The demo student is also the head student of the group, so the name appears twice.
    expect(within(account).getAllByText("Brastilov Aleksey")).toHaveLength(2)
    expect(within(account).getByText("brastilov.aleksey")).toBeInTheDocument()
    expect(within(account).getByText("brastilov.aleksey@mail.ihsu.uz")).toBeInTheDocument()
    expect(within(account).getByRole("button", { name: "Copy" })).toBeInTheDocument()
    expect(within(account).getByText("2TN2")).toBeInTheDocument()
    expect(within(account).getByText("Kalandarova Gavxar")).toBeInTheDocument()
  })

  test("EMIS shows the link status and the last sync", async () => {
    renderSp(<ProfilePage />, { route: "/profile/" })

    const emis = (await screen.findByText("EMIS")).closest("section") as HTMLElement

    expect(within(emis).getByText("Linked")).toBeInTheDocument()
    expect(within(emis).queryByRole("link", { name: "Update EMIS password" })).not.toBeInTheDocument()
  })

  test("a link to update the EMIS password appears when it stopped working", async () => {
    server.use(
      http.get(apiUrl("/v1/me/profile"), () => HttpResponse.json({ ...studentProfile, emis_status: "needs_reauth" })),
    )
    renderSp(<ProfilePage />, { route: "/profile/" })

    const link = await screen.findByRole("link", { name: "Update EMIS password" })

    expect(link.getAttribute("href")).toBe("http://localhost:3001/security/emis/")
  })

  test("Telegram lists the linked accounts and leads to the ID service", async () => {
    renderSp(<ProfilePage />, { route: "/profile/" })

    const telegram = (await screen.findByText("Telegram")).closest("section") as HTMLElement

    expect(within(telegram).getByText("@aleksey_b")).toBeInTheDocument()
    expect(within(telegram).getByRole("link", { name: "Manage" }).getAttribute("href")).toBe(
      "http://localhost:3001/security/telegram/",
    )
  })

  test("storage shows the usage, the quota and the cleanup date", async () => {
    renderSp(<ProfilePage />, { route: "/profile/" })

    const storage = (await screen.findByText("Storage")).closest("section") as HTMLElement

    expect(await within(storage).findByText(/ used$/)).toBeInTheDocument()
    expect(within(storage).getByText(/Files of this term are deleted on/)).toBeInTheDocument()
  })

  test("a failed profile request shows the error state", async () => {
    server.use(
      http.get(apiUrl("/v1/me/profile"), () =>
        HttpResponse.json({ type: "common/internal", title: "x", status: 500 }, { status: 500 }),
      ),
    )
    renderSp(<ProfilePage />, { route: "/profile/" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
