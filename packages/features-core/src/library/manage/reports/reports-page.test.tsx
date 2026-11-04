import { describe, expect, it } from "bun:test"
import { setLibraryActor, testRouter, userMe } from "@ihsp/test-utils"
import { waitFor } from "@testing-library/react"
import { renderLibrary } from "../../test-support"
import { ReportsPage } from "./reports-page"

describe("ReportsPage", () => {
  it("redirects to the queue's reports tab, keeping the other query parameters", async () => {
    setLibraryActor("librarian2")
    renderLibrary(<ReportsPage />, {
      route: "/manage/reports/?q=fizika",
      session: { user: { ...userMe, roles: ["student", "librarian"] } },
    })

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/manage/queue/?q=fizika&tab=reports"))
  })

  it("moves the reports tab into place even when another tab was in the address", async () => {
    setLibraryActor("librarian2")
    renderLibrary(<ReportsPage />, {
      route: "/manage/reports/?tab=held",
      session: { user: { ...userMe, roles: ["student", "librarian"] } },
    })

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/manage/queue/?tab=reports"))
  })
})
