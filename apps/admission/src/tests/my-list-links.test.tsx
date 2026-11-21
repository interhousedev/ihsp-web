import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "bun:test"
import { http, HttpResponse } from "msw"
import { UniListStage } from "../features/chooser/components/list-stage"
import { institution, listEntry, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

const messages = {
  chooser: {
    list: {
      links: { label: "Links of {name}", university: "University", essays: "Essays", documents: "Documents" },
      next: { budget: "Check application budget", essays: "Start essays for {count} universities" },
    },
    fieldFocus: { bannerTitle: "No field chosen", bannerAction: "Choose a field", chip: "{labels}", change: "Change" },
  },
}

const entry = listEntry({ id: "e1", institution: institution({ id: "i1", name: "Alpha U" }) })

afterEach(() => server.resetHandlers())

// next/link drops the trailing slash in bun tests, so hrefs are asserted without it.
describe("list stage pathway", () => {
  it("links each entry to its university, essays and documents", async () => {
    mockChooser({ list: [entry] })
    renderAdmissionApp(<UniListStage />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Show details of Alpha U" }))
    const href = async (name: string) => (await screen.findByRole("link", { name })).getAttribute("href")
    expect(await href("University")).toBe("/chooser/institution?id=i1")
    expect(await href("Essays")).toBe("/essays?tab=colleges&entry=e1")
    expect(await href("Documents")).toBe("/documents?entry=e1")
  })

  it("asks for a field of study above the list when there is none", async () => {
    mockChooser({ list: [entry] })
    server.use(http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json({ study_focus: { labels: [] } })))
    renderAdmissionApp(<UniListStage />, { messages })
    expect(await screen.findByText("No field chosen")).toBeTruthy()
  })
})
