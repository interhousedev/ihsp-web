/** Sharing a file with a link or a person, and the "Shared with me" list. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import type { FileItem, SharedFile } from "@ihsp/api"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { apiUrl, resetSharing, server, sharingState } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import en from "../../messages/en.json"
import notebooks from "../../messages/en/notebooks.json"
import tools from "../../messages/en/tools.json"
import { ShareFileDialog } from "../features/files/components/share-file-dialog"
import { SharedFilesSection } from "../features/files/components/shared-files-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

const messages = mergeMessages(mergeMessages(en as Messages, tools as Messages), notebooks as Messages)
const FILE = { id: "file-1", name: "notes.pdf" } as FileItem
const SHARED = { id: "file-9", name: "biology.pdf", owner_name: "Aziz Rahimov" } as SharedFile
const realOpen = window.open

beforeEach(() => resetSharing())
afterEach(() => {
  window.open = realOpen
})

describe("ShareFileDialog", () => {
  test("stays closed without a file", () => {
    renderSp(<ShareFileDialog file={null} onClose={() => {}} />, { messages })

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("a new link carries the token in the fragment of the file join address", async () => {
    const { user } = renderSp(<ShareFileDialog file={FILE} onClose={() => {}} />, { messages })

    await user.click(await screen.findByRole("button", { name: "Create link" }))

    const field = (await screen.findByRole("textbox", { name: "Link" })) as HTMLInputElement
    expect(field.value).toEndWith("/files/join/#new-token")
    expect(sharingState.file.link_active).toBe(true)
  })

  test("an active link can be turned off", async () => {
    sharingState.file.link_active = true
    const { user } = renderSp(<ShareFileDialog file={FILE} onClose={() => {}} />, { messages })

    await user.click(await screen.findByRole("button", { name: "Turn link off" }))

    await waitFor(() => expect(sharingState.file.link_active).toBe(false))
    expect(await screen.findByRole("button", { name: "Create link" })).toBeInTheDocument()
  })
})

describe("SharedFilesSection", () => {
  test("is absent while nothing is shared", async () => {
    let asked = false
    server.use(
      http.get(apiUrl("/v1/me/shared-files"), () => {
        asked = true
        return HttpResponse.json({ items: [] })
      }),
    )
    renderSp(<SharedFilesSection />, { messages })

    await waitFor(() => expect(asked).toBe(true))
    expect(screen.queryByText("Shared with me")).toBeNull()
  })

  test("names the owner and opens the shared address", async () => {
    sharingState.sharedFiles = [SHARED]
    window.open = mock(() => null) as unknown as typeof window.open
    const { user } = renderSp(<SharedFilesSection />, { messages })

    expect(await screen.findByText("From Aziz Rahimov")).toBeInTheDocument()
    const [download] = within(screen.getByRole("listitem")).getAllByRole("button")
    await user.click(download as HTMLElement)

    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1))
    expect((window.open as unknown as ReturnType<typeof mock>).mock.calls[0]?.[0]).toBe("https://storage.test/shared")
  })

  test("removing a file drops it from the list", async () => {
    sharingState.sharedFiles = [SHARED]
    server.use(
      http.delete(apiUrl("/v1/files/shared/:id"), () => {
        sharingState.sharedFiles = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<SharedFilesSection />, { messages })

    await user.click(await screen.findByRole("button", { name: "Remove from my list" }))

    await waitFor(() => expect(screen.queryByText("biology.pdf")).toBeNull())
  })
})
