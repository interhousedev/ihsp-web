import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { MyList } from "../features/chooser/components/my-list"
import { institution, listEntry, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

const messages = {
  chooser: {
    list: {
      conflicts: {
        title: "Check your early applications",
        toast: "Early-round conflict: {text}",
        explain: {
          multiple_ed: "{names}: only one binding Early Decision (ED) application is allowed.",
          ed_with_restrictive: "{names}: ED cannot be combined with REA or SCEA.",
          multiple_restrictive: "{names}: one restrictive round only.",
          restrictive_with_early: "{names}: check the rules.",
          multiple_ed2: "{names}: only one ED2.",
        },
        badge: {
          multiple_ed: "Several ED",
          ed_with_restrictive: "ED and REA/SCEA",
          multiple_restrictive: "Several REA/SCEA",
          restrictive_with_early: "Check early rules",
          multiple_ed2: "Several ED2",
        },
      },
    },
  },
}

const A = listEntry({
  id: "a",
  round: "ED",
  institution: institution({ id: "ia", name: "Alpha U" }),
  conflicts: [{ code: "multiple_ed", severity: "conflict", entry_ids: ["a", "b"] }],
})
const B = listEntry({
  id: "b",
  round: "ED",
  institution: institution({ id: "ib", name: "Beta U" }),
  conflicts: [{ code: "multiple_ed", severity: "conflict", entry_ids: ["a", "b"] }],
})
const C = listEntry({
  id: "c",
  round: "REA",
  institution: institution({ id: "ic", name: "Gamma U" }),
  bucket: "target",
  conflicts: [{ code: "restrictive_with_early", severity: "check", entry_ids: ["c"] }],
})

afterEach(() => {
  server.resetHandlers()
})

describe("list conflicts", () => {
  it("summarises distinct conflicts in a banner and badges the involved entries", async () => {
    mockChooser({ list: [A, B, C] })
    renderAdmissionApp(<MyList />, { messages })
    const banner = await screen.findByText("Check your early applications")
    const items = within(banner.closest("[data-slot=alert]") as HTMLElement).getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0]?.textContent).toBe("Alpha U, Beta U: only one binding Early Decision (ED) application is allowed.")
    expect(items[0]?.getAttribute("data-severity")).toBe("conflict")
    expect(items[1]?.getAttribute("data-severity")).toBe("check")
    expect(screen.getAllByText("Several ED")).toHaveLength(2)
    expect(screen.getByText("Check early rules")).toBeTruthy()
  })

  it("shows no banner without conflicts", async () => {
    mockChooser({ list: [listEntry({ id: "z", institution: institution({ id: "iz", name: "Zed U" }) })] })
    renderAdmissionApp(<MyList />, { messages })
    await screen.findByText("Zed U")
    expect(screen.queryByText("Check your early applications")).toBeNull()
  })

  it("warns, without blocking, when a change introduces a conflict", async () => {
    const warn = spyOn(toast, "warning").mockImplementation(() => "")
    const plain = listEntry({ id: "a", institution: institution({ id: "ia", name: "Alpha U" }), round: "RD" })
    const other = listEntry({ id: "b", institution: institution({ id: "ib", name: "Beta U" }), round: "ED" })
    mockChooser({ list: [plain, other] })
    server.use(
      http.patch(apiUrl("/v1/admission/list/a"), () =>
        HttpResponse.json({ ...plain, round: "ED", notes: "x", conflicts: A.conflicts }),
      ),
    )
    renderAdmissionApp(<MyList />, { messages })
    await screen.findByText("Alpha U")
    fireEvent.click(screen.getAllByRole("button", { name: "Notes and affordability" })[0] as HTMLElement)
    const notes = screen.getAllByLabelText("Notes")[0] as HTMLTextAreaElement
    fireEvent.change(notes, { target: { value: "x" } })
    fireEvent.blur(notes)
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1))
    expect(String(warn.mock.calls[0]?.[0])).toContain("Early-round conflict: Alpha U, Beta U")
    warn.mockRestore()
  })
})
