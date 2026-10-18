/** ACA-15: the mark planner page and its entry point, the "Plan" link of the grades page. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, plannerFor, plannerMath, server, setDropdownValue } from "@ihsp/test-utils"
import type { PlannerTarget, SubjectPlanner } from "@ihsp/api"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, delay, http } from "msw"
import { GradesPage } from "../features/grades/components/grades-page"
import { PlannerPage } from "../features/grades/planner/components/planner-page"
import { configureTests, findCard, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(() => {
  unfreezeTime()
  setViewportWidth(1280)
})

const PLANNER_ROUTE = `/grades/plan/?subject=${ids.math}`
const PLANNER_URL = "/v1/me/subjects/:subjectId/planner"

/** Next's `Link` drops the trailing slash of an internal path in tests; compare paths without it. */
const path = (href: string | null) => (href ?? "").replace(/\/(?=\?|$)/, "")

function target(grade: 5 | 4 | 3, spec: Partial<PlannerTarget> = {}): PlannerTarget {
  return {
    grade,
    threshold: grade - 0.5,
    status: "needed",
    control: null,
    min_value: null,
    min_both: null,
    pairs: [],
    ...spec,
  }
}

/** The planner of Mathematics with some fields changed, as the server's answer for every request. */
function answer(spec: Partial<SubjectPlanner>): void {
  server.use(http.get(apiUrl(PLANNER_URL), () => HttpResponse.json({ ...plannerMath, ...spec })))
}

/** The requests the page makes to the planner, in order (the default handler still answers). */
function recordPlannerRequests(): { urls: string[]; stop: () => void } {
  const urls: string[] = []
  const listener = ({ request }: { request: Request }) => {
    if (request.url.includes("/planner")) urls.push(request.url)
  }
  server.events.on("request:start", listener)
  return { urls, stop: () => server.events.removeListener("request:start", listener) }
}

const whatIfOf = (url: string | undefined) => new URL(url ?? "").searchParams.getAll("what_if")

async function renderPlanner(route = PLANNER_ROUTE) {
  const view = renderSp(<PlannerPage />, { route })
  await screen.findByTestId("planner-predicted")
  return view
}

function addMark(type: "lesson" | "midterm" | "final", mark: number): void {
  setDropdownValue(screen.getByLabelText("Type"), type)
  setDropdownValue(screen.getByLabelText("Mark"), String(mark))
  fireEvent.click(screen.getByRole("button", { name: "Add" }))
}

describe("planner header and marks", () => {
  test("names the subject and the semester", async () => {
    await renderPlanner()

    expect(screen.getByRole("heading", { level: 1, name: "Mathematics" })).toBeInTheDocument()
    expect(screen.getByText("Mark planner · semester 4")).toBeInTheDocument()
    expect(path(screen.getByRole("link", { name: "Back: Grades" }).getAttribute("href"))).toBe("/grades?semester=4")
  })

  test("shows the count and the average of every kind of mark and the semester mark", async () => {
    await renderPlanner()

    const lesson = within(screen.getByTestId("planner-stat-lesson"))
    expect(lesson.getByText("Lessons")).toBeInTheDocument()
    expect(lesson.getByText("4.67")).toBeInTheDocument()
    expect(lesson.getByText("3 marks")).toBeInTheDocument()
    const midterm = within(screen.getByTestId("planner-stat-midterm"))
    expect(midterm.getByText("4.00")).toBeInTheDocument()
    expect(midterm.getByText("1 mark")).toBeInTheDocument()
    const final = within(screen.getByTestId("planner-stat-final"))
    expect(final.getByText("–")).toBeInTheDocument()
    expect(final.getByText("No marks")).toBeInTheDocument()
    expect(screen.getByTestId("planner-semester-mark")).toHaveTextContent("4.33")
  })

  test("a line names the kind of mark that is missing", async () => {
    await renderPlanner()

    expect(screen.getByTestId("planner-missing")).toHaveTextContent("Final not yet")
  })

  test("the line names several missing kinds and nothing is said when none is missing", async () => {
    answer({ missing: ["midterm", "final"] })
    await renderPlanner()
    expect(screen.getByTestId("planner-missing")).toHaveTextContent("Midterm not yet · Final not yet")

    answer({ missing: [] })
    const second = within(renderSp(<PlannerPage />, { route: `/grades/plan/?subject=${ids.physics}` }).container)
    await second.findByTestId("planner-predicted")
    expect(second.queryByTestId("planner-missing")).not.toBeInTheDocument()
  })
})

describe("predicted mark", () => {
  test("shows the predicted semester mark with the marks it assumed for the remaining controls", async () => {
    await renderPlanner()

    expect(screen.getByTestId("planner-predicted")).toHaveTextContent("4.56")
    expect(screen.getByTestId("planner-predicted-note")).toHaveTextContent(
      "Assuming a 5 on every remaining midterm and a 5 on the final.",
    )
  })

  test("names only the kind of control that is still to come", async () => {
    answer({ predicted: { value: 4.4, midterm: 4, final: null }, remaining: { midterm: 2, final: 0 } })
    await renderPlanner()
    expect(screen.getByTestId("planner-predicted-note")).toHaveTextContent("Assuming a 4 on every remaining midterm.")
  })

  test("names the final alone", async () => {
    answer({ predicted: { value: 4.4, midterm: null, final: 3 }, remaining: { midterm: 0, final: 1 } })
    await renderPlanner()
    expect(screen.getByTestId("planner-predicted-note")).toHaveTextContent("Assuming a 3 on the final.")
  })

  test("with every control marked the prediction is the semester mark", async () => {
    answer({ predicted: { value: 4.5, midterm: null, final: null }, remaining: { midterm: 0, final: 0 } })
    await renderPlanner()
    expect(screen.getByTestId("planner-predicted")).toHaveTextContent("4.50")
    expect(screen.getByTestId("planner-predicted-note")).toHaveTextContent("Every control already has a mark")
  })

  test("without lesson marks there is nothing to predict and it says to add them", async () => {
    answer(plannerFor("math", null))
    await renderPlanner()

    expect(screen.getByTestId("planner-predicted")).toHaveTextContent("–")
    expect(screen.getByTestId("planner-predicted-note")).toHaveTextContent(
      "Add lesson marks first: without them there is nothing to predict from.",
    )
    expect(screen.getByTestId("planner-semester-mark")).toHaveTextContent("No semester mark yet")
    expect(screen.getByTestId("planner-missing")).toHaveTextContent(
      "No lesson marks yet · Midterm not yet · Final not yet",
    )
  })

  test("the prediction is a polite live region so a screen reader hears it change", async () => {
    await renderPlanner()

    const region = screen.getByTestId("planner-predicted").closest("[aria-live]")
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region).toHaveAttribute("aria-atomic", "true")
  })
})

describe("targets", () => {
  test("a card for each of the grades 5, 4 and 3 with the semester mark it takes", async () => {
    await renderPlanner()

    for (const [grade, threshold] of [
      [5, "4.50"],
      [4, "3.50"],
      [3, "2.50"],
    ] as const) {
      const card = within(screen.getByTestId(`planner-target-${grade}`))
      expect(card.getByRole("heading", { name: `Grade ${grade}` })).toBeInTheDocument()
      expect(card.getByText(`Semester mark ${threshold} or higher`)).toBeInTheDocument()
    }
  })

  test("a secured grade says it comes whatever the remaining controls bring", async () => {
    await renderPlanner()

    const card = within(screen.getByTestId("planner-target-4"))
    expect(card.getByText("Secured")).toBeInTheDocument()
    expect(card.getByText("You get this grade whatever the remaining controls bring.")).toBeInTheDocument()
  })

  test("with both kinds of control left it gives the lowest mark for all and a table of finals", async () => {
    await renderPlanner()

    const card = within(screen.getByTestId("planner-target-5"))
    expect(card.getByText("Needs marks")).toBeInTheDocument()
    expect(card.getByText("Get at least a 5 on every remaining control.")).toBeInTheDocument()
    const table = within(card.getByRole("table", { name: "Lowest final for each midterm mark" }))
    const rows = table.getAllByRole("row").slice(1)
    expect(rows).toHaveLength(4)
    expect(
      within(rows[0] as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["5", "5"])
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["4", "Not reachable"])
    expect(
      within(rows[3] as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["2", "Not reachable"])
  })

  test("a final mark in the table is the lowest one that works with that midterm mark", async () => {
    answer({
      targets: [
        target(5, {
          pairs: [
            { midterm: 5, min_final: 3 },
            { midterm: 4, min_final: 5 },
          ],
        }),
        target(4, { status: "secured" }),
        target(3, { status: "secured" }),
      ],
    })
    await renderPlanner()

    const card = within(screen.getByTestId("planner-target-5"))
    const rows = card.getAllByRole("row").slice(1)
    expect(
      within(rows[0] as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["5", "3"])
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["4", "5"])
    expect(card.queryByText(/on every remaining control/)).not.toBeInTheDocument()
  })

  test("with only midterms left it names the lowest mark for each of them", async () => {
    answer({
      remaining: { midterm: 2, final: 0 },
      targets: [
        target(5, { control: "midterm", min_value: 5 }),
        target(4, { control: "midterm", min_value: 4 }),
        target(3, { status: "secured" }),
      ],
    })
    await renderPlanner()

    expect(
      within(screen.getByTestId("planner-target-5")).getByText("Get at least a 5 on each of the 2 remaining midterms."),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("planner-target-4")).getByText("Get at least a 4 on each of the 2 remaining midterms."),
    ).toBeInTheDocument()
  })

  test("with a single midterm left it says the midterm, not each of them", async () => {
    answer({
      remaining: { midterm: 1, final: 0 },
      targets: [
        target(5, { control: "midterm", min_value: 4 }),
        target(4, { status: "secured" }),
        target(3, { status: "secured" }),
      ],
    })
    await renderPlanner()

    expect(
      within(screen.getByTestId("planner-target-5")).getByText("Get at least a 4 on the remaining midterm."),
    ).toBeInTheDocument()
  })

  test("with only the final left it names the lowest mark for the final", async () => {
    answer({
      remaining: { midterm: 0, final: 1 },
      targets: [
        target(5, { control: "final", min_value: 5 }),
        target(4, { status: "secured" }),
        target(3, { status: "secured" }),
      ],
    })
    await renderPlanner()

    expect(
      within(screen.getByTestId("planner-target-5")).getByText("Get at least a 5 on the final."),
    ).toBeInTheDocument()
  })

  test("a grade that can no longer be reached says so", async () => {
    answer({
      targets: [
        target(5, { status: "not_reachable" }),
        target(4, { status: "secured" }),
        target(3, { status: "secured" }),
      ],
    })
    await renderPlanner()

    const card = within(screen.getByTestId("planner-target-5"))
    expect(card.getByText("Out of reach")).toBeInTheDocument()
    expect(card.getByText("Not reachable this semester, even with a 5 on every remaining control.")).toBeInTheDocument()
  })

  test("without lesson marks every grade says to add lesson marks first", async () => {
    answer(plannerFor("math", null))
    await renderPlanner()

    for (const grade of [5, 4, 3]) {
      const card = within(screen.getByTestId(`planner-target-${grade}`))
      expect(card.getByText("Not known yet")).toBeInTheDocument()
      expect(card.getByText("Add lesson marks first: there is nothing to plan from yet.")).toBeInTheDocument()
    }
  })

  test("each target card is a section named by its grade", async () => {
    await renderPlanner()

    expect((await findCard("Grade 3")).tagName).toBe("SECTION")
  })
})

describe("request", () => {
  test("asks for the subject of the address, without a semester or what-if marks", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner()

      expect(requests.urls).toHaveLength(1)
      const url = new URL(requests.urls[0] ?? "")
      expect(url.pathname).toBe(`/v1/me/subjects/${ids.math}/planner`)
      expect(url.searchParams.has("semester")).toBe(false)
      expect(url.searchParams.has("what_if")).toBe(false)
    } finally {
      requests.stop()
    }
  })

  test("passes the semester of the address on", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner(`${PLANNER_ROUTE}&semester=3`)

      expect(new URL(requests.urls[0] ?? "").searchParams.get("semester")).toBe("3")
    } finally {
      requests.stop()
    }
  })

  test("without a subject in the address it sends the student to the grades", () => {
    renderSp(<PlannerPage />, { route: "/grades/plan/" })

    expect(screen.getByText("Open the planner from a subject on the Grades page.")).toBeInTheDocument()
    expect(path(screen.getByRole("link", { name: "Back: Grades" }).getAttribute("href"))).toBe("/grades")
  })

  test("a subject the planner does not know shows the error with a retry", async () => {
    server.use(http.get(apiUrl(PLANNER_URL), () => HttpResponse.json({ detail: "x" }, { status: 404 })))
    renderSp(<PlannerPage />, { route: PLANNER_ROUTE })

    expect(await screen.findByRole("button", { name: /retry|try again/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument()
  })
})

describe("what-if marks", () => {
  test("starts with no marks and a disabled Reset", async () => {
    await renderPlanner()

    expect(screen.getByText("No marks tried yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled()
    expect(screen.getByLabelText("Type")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Mark"))
    const marks = within(screen.getByRole("listbox")).getAllByRole("option")
    expect(marks.map((option) => option.textContent)).toEqual(["5", "4", "3", "2"])
  })

  test("Add puts a chip in the list and asks again with what_if=<type>:<value>", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner()

      addMark("final", 4)

      expect(await screen.findByText("Final (FC) 4")).toBeInTheDocument()
      await waitFor(() => expect(requests.urls).toHaveLength(2))
      expect(whatIfOf(requests.urls[1])).toEqual(["final:4"])
      expect(screen.queryByText("No marks tried yet.")).not.toBeInTheDocument()
    } finally {
      requests.stop()
    }
  })

  test("several marks are sent as repeated what_if values in the order they were added", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner()

      addMark("midterm", 5)
      await screen.findByText("Midterm (PC) 5")
      addMark("lesson", 3)
      await screen.findByText("Lesson 3")

      await waitFor(() => expect(requests.urls).toHaveLength(3))
      expect(whatIfOf(requests.urls[2])).toEqual(["midterm:5", "lesson:3"])
      expect(within(screen.getByTestId("what-if-chips")).getAllByRole("listitem")).toHaveLength(2)
    } finally {
      requests.stop()
    }
  })

  test("a chip's remove button drops that mark and asks again without it", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner()
      addMark("midterm", 5)
      await screen.findByText("Midterm (PC) 5")
      addMark("final", 2)
      await screen.findByText("Final (FC) 2")
      await waitFor(() => expect(requests.urls).toHaveLength(3))

      fireEvent.click(screen.getByRole("button", { name: "Remove Midterm (PC) 5" }))

      await waitFor(() => expect(screen.queryByText("Midterm (PC) 5")).not.toBeInTheDocument())
      await waitFor(() => expect(requests.urls).toHaveLength(4))
      expect(whatIfOf(requests.urls[3])).toEqual(["final:2"])
      expect(screen.getByText("Final (FC) 2")).toBeInTheDocument()
    } finally {
      requests.stop()
    }
  })

  test("the same mark can be tried twice and removed one at a time", async () => {
    await renderPlanner()
    addMark("lesson", 5)
    await screen.findByText("Lesson 5")
    addMark("lesson", 5)
    await waitFor(() => expect(screen.getAllByText("Lesson 5")).toHaveLength(2))

    fireEvent.click(screen.getAllByRole("button", { name: "Remove Lesson 5" })[0] as HTMLElement)

    await waitFor(() => expect(screen.getAllByText("Lesson 5")).toHaveLength(1))
  })

  test("Reset removes every mark and asks again without what_if", async () => {
    const requests = recordPlannerRequests()
    try {
      await renderPlanner()
      addMark("midterm", 3)
      await screen.findByText("Midterm (PC) 3")
      addMark("final", 3)
      await screen.findByText("Final (FC) 3")
      await waitFor(() => expect(requests.urls).toHaveLength(3))

      fireEvent.click(screen.getByRole("button", { name: "Reset" }))

      expect(await screen.findByText("No marks tried yet.")).toBeInTheDocument()
      await waitFor(() => expect(requests.urls).toHaveLength(4))
      expect(whatIfOf(requests.urls[3])).toEqual([])
      expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled()
    } finally {
      requests.stop()
    }
  })

  test("the prediction changes to what the planner answers for the tried marks", async () => {
    server.use(
      http.get(apiUrl(PLANNER_URL), ({ request }) => {
        const tried = new URL(request.url).searchParams.getAll("what_if")
        return HttpResponse.json(
          tried.length === 0
            ? plannerMath
            : {
                ...plannerMath,
                predicted: { value: 4.9, midterm: 5, final: 5 },
                semester_mark: 4.8,
                what_if: [{ type: "final", value: 5 }],
                assumptions: [...plannerMath.assumptions, "what_if"],
              },
        )
      }),
    )
    await renderPlanner()
    expect(screen.getByTestId("planner-predicted")).toHaveTextContent("4.56")

    addMark("final", 5)

    await waitFor(() => expect(screen.getByTestId("planner-predicted")).toHaveTextContent("4.90"))
    expect(screen.getByTestId("planner-semester-mark")).toHaveTextContent("4.80")
  })

  test("the previous answer stays on screen while the new one loads", async () => {
    server.use(
      http.get(apiUrl(PLANNER_URL), async ({ request }) => {
        if (new URL(request.url).searchParams.getAll("what_if").length === 0) return HttpResponse.json(plannerMath)
        await delay(400)
        return HttpResponse.json({ ...plannerMath, predicted: { value: 3.2, midterm: 3, final: 3 } })
      }),
    )
    await renderPlanner()

    addMark("final", 2)

    // The old prediction is still there, marked busy, and no loading placeholder replaced the page.
    await screen.findByText("Final (FC) 2")
    expect(screen.getByTestId("planner-predicted")).toHaveTextContent("4.56")
    expect(screen.getByTestId("planner-predicted").closest("[aria-live]")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("heading", { level: 1, name: "Mathematics" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("planner-predicted")).toHaveTextContent("3.20"))
    expect(screen.getByTestId("planner-predicted").closest("[aria-live]")).toHaveAttribute("aria-busy", "false")
  })

  test("a failed answer keeps the editor, so the mark that broke it can be removed", async () => {
    server.use(
      http.get(apiUrl(PLANNER_URL), ({ request }) =>
        new URL(request.url).searchParams.getAll("what_if").length === 0
          ? HttpResponse.json(plannerMath)
          : HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
    )
    await renderPlanner()

    addMark("final", 2)

    const remove = await screen.findByRole("button", { name: "Remove Final (FC) 2" })
    await waitFor(() => expect(screen.queryByTestId("planner-predicted")).not.toBeInTheDocument())
    fireEvent.click(remove)
    expect(await screen.findByTestId("planner-predicted")).toHaveTextContent("4.56")
  })

  test("there is no 20-mark cap: 25 marks can be tried and Add stays enabled", async () => {
    await renderPlanner()
    for (let index = 0; index < 25; index++) addMark("lesson", 5)

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remove Lesson 5" })).toHaveLength(25))
    expect(screen.getByRole("button", { name: "Add" })).not.toBeDisabled()
    expect(screen.queryByText(/marks at once/)).not.toBeInTheDocument()
  })
})

describe("the Plan link on the grades page", () => {
  test("every row of the table links to the planner of its subject and semester", async () => {
    renderSp(<GradesPage />, { route: "/grades/" })

    const link = await screen.findByRole("link", { name: "Mark planner: Physics" })

    expect(link).toHaveTextContent("Plan")
    expect(path(link.getAttribute("href"))).toBe(`/grades/plan?subject=${ids.physics}&semester=4`)
    expect(screen.getAllByRole("link", { name: /^Mark planner: / }).length).toBeGreaterThan(3)
  })

  test("the cards of a phone have the link too", async () => {
    setViewportWidth(360)
    renderSp(<GradesPage />, { route: "/grades/" })

    const cards = await screen.findAllByTestId("grade-card")

    for (const card of cards) {
      expect(within(card).getByRole("link", { name: /^Mark planner: / })).toHaveTextContent("Plan")
    }
    const physics = cards.find((card) => card.textContent?.includes("Physics")) as HTMLElement
    expect(path(within(physics).getByRole("link", { name: "Mark planner: Physics" }).getAttribute("href"))).toBe(
      `/grades/plan?subject=${ids.physics}&semester=4`,
    )
  })

  test("the subject link of a row is still the one that opens its marks", async () => {
    renderSp(<GradesPage />, { route: "/grades/" })

    const link = await screen.findByRole("link", { name: "Physics" })

    expect(link.getAttribute("href")).toMatch(/^\/subjects\/view\/?\?id=.+&tab=marks&semester=4$/)
  })
})
