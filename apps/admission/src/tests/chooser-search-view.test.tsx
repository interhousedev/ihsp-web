/** Chooser search: the List | Discover toggle, the preferences sheet and the study-field chip or banner. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { SearchView } from "../features/chooser/components/search-view"
import { institution, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

const messages = {
  chooser: {
    view: { label: "View", list: "List", discover: "Discover" },
    prefs: { open: "Preferences", title: "Your preferences" },
    nextStep: { review: "Review my list ({count})" },
    fieldFocus: {
      chip: "Field of study: {labels}",
      change: "change",
      bannerTitle: "Choose your field of study",
      bannerAction: "Choose a field",
    },
  },
}

const plan = (labels: string[]) =>
  http.get(apiUrl("/v1/admission/career"), () =>
    HttpResponse.json({
      answers: {},
      fit: [],
      lock_version: 1,
      majors: [],
      minors: [],
      professions: [],
      spike: null,
      student_id: "00000000-0000-0000-0000-000000000001",
      study_focus: { field_ids: labels, labels },
    }),
  )

const render = (route: string) => renderAdmissionApp(<SearchView />, { route, messages })

describe("chooser search view toggle", () => {
  it("shows the list by default and switches to Discover through ?view", async () => {
    mockChooser({ items: [institution()] })
    render("/chooser/search/")
    await screen.findByText("Uni One")
    expect(screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Discover" }))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/search/?view=discover"))
  })

  it("renders Discover for ?view=discover", async () => {
    mockChooser({ items: [institution()] })
    render("/chooser/search/?view=discover")
    expect(await screen.findByRole("button", { name: "Discover" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Discover" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.queryByText("Uni One")).toBeNull()
  })
})

describe("chooser search preferences", () => {
  it("opens the preferences sheet for ?prefs=1 and closing drops the param", async () => {
    mockChooser({ items: [institution()] })
    server.use(
      http.get(apiUrl("/v1/admission/preferences"), () =>
        HttpResponse.json({ answers: {}, tags: [], completed: false, updated_at: null }),
      ),
    )
    render("/chooser/search/?prefs=1")
    expect(await screen.findByText("Your preferences")).toBeDefined()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/search/"))
  })

  it("the Preferences button sets ?prefs=1", async () => {
    mockChooser({ items: [institution()] })
    render("/chooser/search/")
    fireEvent.click(await screen.findByRole("button", { name: "Preferences" }))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/search/?prefs=1"))
  })
})

describe("chooser search field of study", () => {
  it("shows the chosen fields as a chip linking to the career field tab", async () => {
    mockChooser({ items: [institution()] })
    server.use(plan(["Biology", "Physics"]))
    render("/chooser/search/")
    expect(await screen.findByText("Field of study: Biology, Physics")).toBeDefined()
    expect(screen.getByRole("link", { name: "change" }).getAttribute("href")).toBe("/career?tab=field")
  })

  it("shows a banner when no field is chosen", async () => {
    mockChooser({ items: [institution()] })
    server.use(plan([]))
    render("/chooser/search/")
    expect(await screen.findByText("Choose your field of study")).toBeDefined()
    expect(screen.getByRole("link", { name: "Choose a field" }).getAttribute("href")).toBe("/career?tab=field")
  })
})

describe("chooser search next step", () => {
  it("links to the list", async () => {
    mockChooser({ items: [institution()] })
    render("/chooser/search/")
    const link = await screen.findByRole("link", { name: /Review my list/ })
    expect(link.getAttribute("href")).toBe("/chooser/list")
  })
})
