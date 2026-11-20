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
    render("/chooser/?step=match&view=list")
    await screen.findByText("Uni One")
    expect(screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Discover" }))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/?step=match"))
  })

  it("renders Discover for ?view=discover", async () => {
    mockChooser({ items: [institution()] })
    render("/chooser/?step=match")
    expect(await screen.findByRole("button", { name: "Discover" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Discover" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.queryByText("Uni One")).toBeNull()
  })
})

describe("chooser search field of study", () => {
  it("shows the chosen fields as a chip linking to the career field tab", async () => {
    mockChooser({ items: [institution()] })
    server.use(plan(["Biology", "Physics"]))
    render("/chooser/?step=match&view=list")
    expect(await screen.findByText("Field of study: Biology, Physics")).toBeDefined()
    expect(screen.getByRole("link", { name: "change" }).getAttribute("href")).toBe("/career?tab=field")
  })

  it("shows a banner when no field is chosen", async () => {
    mockChooser({ items: [institution()] })
    server.use(plan([]))
    render("/chooser/?step=match&view=list")
    expect(await screen.findByText("Choose your field of study")).toBeDefined()
    expect(screen.getByRole("link", { name: "Choose a field" }).getAttribute("href")).toBe("/career?tab=field")
  })
})
