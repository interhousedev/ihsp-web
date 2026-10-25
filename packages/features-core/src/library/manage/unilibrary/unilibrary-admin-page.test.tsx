import { describe, expect, it } from "bun:test"
import {
  getUniLibrary,
  libActors,
  libExternalCards,
  selectDropdownValue,
  setLibraryActor,
  userMe,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { useUniLibraryAvailability } from "../../hooks/use-uni-library"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { UniLibraryAdminPage } from "./unilibrary-admin-page"

allowSlowRenders()

function Probe() {
  return <p data-testid="availability">{useUniLibraryAvailability()}</p>
}

function renderAdmin() {
  setLibraryActor("admin")
  return renderLibrary(
    <>
      <Probe />
      <UniLibraryAdminPage />
    </>,
    { route: "/manage/unilibrary/", session: { user: { ...userMe, roles: ["admin"] } } },
  )
}

describe("UniLibraryAdminPage: settings", () => {
  it("shows UniLibrary as off by default and explains that nothing from it shows while it is off", async () => {
    renderAdmin()

    const settings = await screen.findByRole("region", { name: "Settings" })
    expect(within(settings).getByText("Off")).toBeInTheDocument()
    expect(within(settings).getByText(/Off by default\. While off, nothing from UniLibrary shows/)).toBeInTheDocument()
    expect(within(settings).getByRole("switch", { name: "Enable UniLibrary" })).not.toBeChecked()
    expect(within(settings).getByRole("switch", { name: "Show anonymous cards" })).not.toBeChecked()
    expect(within(settings).getByRole("button", { name: "Save settings" })).toBeDisabled()
  })

  it("switches UniLibrary on, saves, and the visitor-side probe finds it enabled without a reload", async () => {
    const { user } = renderAdmin()
    const settings = await screen.findByRole("region", { name: "Settings" })
    await waitFor(() => expect(screen.getByTestId("availability")).toHaveTextContent("disabled"))

    await user.click(within(settings).getByRole("switch", { name: "Enable UniLibrary" }))
    expect(within(settings).getByText("Unsaved changes")).toBeInTheDocument()
    await user.click(within(settings).getByRole("button", { name: "Save settings" }))

    await waitFor(() => expect(getUniLibrary().enabled).toBe(true))
    await waitFor(() => expect(screen.getByTestId("availability")).toHaveTextContent("enabled"))
    await waitFor(() => expect(within(settings).getByText("On")).toBeInTheDocument())
    expect(within(settings).getByRole("button", { name: "Save settings" })).toBeDisabled()
  })

  it("saves the anonymous cards switch", async () => {
    const { user } = renderAdmin()
    const settings = await screen.findByRole("region", { name: "Settings" })

    await user.click(within(settings).getByRole("switch", { name: "Show anonymous cards" }))
    await user.click(within(settings).getByRole("button", { name: "Save settings" }))

    await waitFor(() => expect(within(settings).getByRole("switch", { name: "Show anonymous cards" })).toBeChecked())
    await waitFor(() => expect(within(settings).getByRole("button", { name: "Save settings" })).toBeDisabled())
  })
})

describe("UniLibraryAdminPage: status", () => {
  it("shows the breaker, the cache, the last calls and the hidden records", async () => {
    renderAdmin()

    const status = await screen.findByRole("region", { name: "Status" })
    expect(await within(status).findByText("Working")).toBeInTheDocument()
    expect(within(status).getByText("Calls go to UniLibrary as usual.")).toBeInTheDocument()
    expect(within(status).getByText("90%")).toBeInTheDocument()
    const calls = within(status).getByRole("table")
    expect(within(calls).getAllByRole("row")).toHaveLength(4)
    expect(within(calls).getByText("Failed")).toBeInTheDocument()
    expect(within(calls).getByText("2400 ms")).toBeInTheDocument()
    const hidden = within(status).getByRole("list", { name: "Hidden records" })
    expect(within(hidden).getByText(libExternalCards[4]!.title)).toBeInTheDocument()
  })

  it("says that feeds and mapping are coming instead of showing a half-built screen", async () => {
    renderAdmin()

    const note = await screen.findByRole("note")
    expect(note).toHaveTextContent("Feeds and mapping are coming.")
  })
})

describe("UniLibraryAdminPage: sanctions", () => {
  it("needs a valid user id and a reason", async () => {
    const { user } = renderAdmin()
    const form = await screen.findByRole("region", { name: "Warnings and upload bans" })

    await user.click(within(form).getByRole("button", { name: "Record decision" }))

    expect(await within(form).findByText(/Enter the user id as a UUID/)).toBeInTheDocument()
    expect(within(form).getByText("Write a reason.")).toBeInTheDocument()
  })

  it("records a warning and an upload ban", async () => {
    const { user } = renderAdmin()
    const form = await screen.findByRole("region", { name: "Warnings and upload bans" })

    await user.type(within(form).getByLabelText("User id"), libActors.student.id)
    await user.type(within(form).getByLabelText("Reason"), "Exam paper uploaded early")
    await user.click(within(form).getByRole("button", { name: "Record decision" }))
    expect(await within(form).findByText(`Warning recorded for ${libActors.student.id}.`)).toBeInTheDocument()

    await user.type(within(form).getByLabelText("User id"), libActors.student.id)
    await selectDropdownValue(user, within(form).getByLabelText("Decision"), "upload_ban")
    await user.type(within(form).getByLabelText("Ban lasts until"), "2026-12-01")
    await user.type(within(form).getByLabelText("Reason"), "Repeated upheld reports")
    await user.click(within(form).getByRole("button", { name: "Record decision" }))
    expect(
      await within(form).findByText((text) => text.startsWith(`Upload ban recorded for ${libActors.student.id}.`)),
    ).toBeInTheDocument()
  })
})

describe("UniLibraryAdminPage: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = renderAdmin()
    await screen.findByRole("switch", { name: "Enable UniLibrary" })
    await screen.findByText("Working")

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
