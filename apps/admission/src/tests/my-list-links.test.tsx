import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "bun:test"
import { http, HttpResponse } from "msw"
import { MyList } from "../features/chooser/components/my-list"
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
describe("my list pathway", () => {
  it("links each entry to its university, essays and documents", async () => {
    mockChooser({ list: [entry] })
    renderAdmissionApp(<MyList />, { messages })
    const href = async (name: string) => (await screen.findByRole("link", { name })).getAttribute("href")
    expect(await href("University")).toBe("/chooser/institution?id=i1")
    expect(await href("Essays")).toBe("/essays?tab=colleges&entry=e1")
    expect(await href("Documents")).toBe("/documents?entry=e1")
  })

  it("ends with the budget and essays suggestions", async () => {
    mockChooser({ list: [entry] })
    renderAdmissionApp(<MyList />, { messages })
    const budget = await screen.findByRole("link", { name: /Check application budget/ })
    expect(budget.getAttribute("href")).toBe("/chooser/budget")
    const essays = await screen.findByRole("link", { name: /Start essays for 1 universities/ })
    expect(essays.getAttribute("href")).toBe("/essays?tab=colleges")
  })

  it("asks for a field of study above the list when there is none", async () => {
    mockChooser({ list: [entry] })
    server.use(http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json({ study_focus: { labels: [] } })))
    renderAdmissionApp(<MyList />, { messages })
    expect(await screen.findByText("No field chosen")).toBeTruthy()
  })
})
