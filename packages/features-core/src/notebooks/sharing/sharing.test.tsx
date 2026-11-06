import { beforeEach, describe, expect, test } from "bun:test"
import type { SharedNotebook } from "@ihsp/api"
import { resetSharing, server, sharingState } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { renderNotebook } from "../test-support"
import { NotebookJoinPage } from "./notebook-join-page"
import { ShareNotebookDialog } from "./share-notebook-dialog"
import { SharedNotebooksSection } from "./shared-notebooks-section"

describe("sharing a notebook", () => {
  beforeEach(() => resetSharing())

  test("creating a link shows an address with the token in the fragment", async () => {
    renderNotebook(<ShareNotebookDialog notebookId="nb-1" open onOpenChange={() => {}} />)

    await userEvent.click(await screen.findByRole("button", { name: "Create link" }))

    const field = (await screen.findByRole("textbox", { name: "Link" })) as HTMLInputElement
    expect(field.value).toContain("/notebooks/join/#new-token")
  })

  test("a person found by name gets access and can be removed", async () => {
    renderNotebook(<ShareNotebookDialog notebookId="nb-1" open onOpenChange={() => {}} />)

    await userEvent.type(await screen.findByRole("textbox", { name: /name/i }), "dil")
    await userEvent.click(await screen.findByRole("button", { name: "Dilnoza Karimova" }))
    await waitFor(() => expect(sharingState.notebook.people).toHaveLength(1))
    await userEvent.click(await screen.findByRole("button", { name: "Remove Dilnoza Karimova" }))

    await waitFor(() => expect(sharingState.notebook.people).toHaveLength(0))
  })

  test("a refusal from the backend is shown and nothing is pretended", async () => {
    server.use(
      http.post("*/v1/notebooks/:id/shares/link", () =>
        HttpResponse.json(
          { type: "notebooks/share-unsupported", title: "x", status: 409, message_key: "x" },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderNotebook(<ShareNotebookDialog notebookId="nb-1" open onOpenChange={() => {}} />)

    await userEvent.click(await screen.findByRole("button", { name: "Create link" }))

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Link" })).toBeNull())
  })

  test("shared with me is absent when nothing is shared", async () => {
    renderNotebook(<SharedNotebooksSection />)

    await waitFor(() => expect(screen.queryByText("Shared with me")).toBeNull())
  })

  test("shared with me names the owner", async () => {
    sharingState.sharedNotebooks = [
      { id: "nb-9", title: "Biology", emoji: null, owner_name: "Aziz Rahimov" } as SharedNotebook,
    ]
    renderNotebook(<SharedNotebooksSection />)

    expect(await screen.findByText("From Aziz Rahimov")).toBeTruthy()
    expect(screen.getByText("Biology")).toBeTruthy()
  })
})

describe("opening a share link", () => {
  beforeEach(() => resetSharing())

  test("a link that no longer works says so", async () => {
    window.location.hash = "#bad-token"
    renderNotebook(<NotebookJoinPage />)

    expect(await screen.findByText(/does not work any more/)).toBeTruthy()
  })

  test("the token leaves the address bar at once", async () => {
    window.location.hash = "#good-token"
    renderNotebook(<NotebookJoinPage />)

    await waitFor(() => expect(window.location.hash).toBe(""))
  })
})
