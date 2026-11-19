import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CareerPage } from "./components/career-page"
import { mockChooser } from "../../tests/chooser-handlers"
import { mockQuizzes } from "../../tests/quiz-handlers"
import { QUIZ, recommend } from "./quiz"

const major = (code: string, sort: number) => ({
  id: code,
  code,
  area: "stem",
  name: { en: code.replace("_", " "), ru: code, uz: code },
  minor_ok: true,
  sort_order: sort,
  active: true,
})
const MAJORS = ["computer_science", "data_science", "mathematics", "physics", "biology", "business"].map(major)

const plan = (majors: string[] = []) => ({
  student_id: "s1",
  answers: {},
  professions: [],
  majors,
  minors: [],
  fit: [],
  spike: null,
  lock_version: 3,
})

function setup(puts: unknown[]) {
  const quizzes = mockQuizzes()
  server.use(
    http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json(plan())),
    http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: MAJORS })),
    http.get(apiUrl("/v1/admission/career/questions"), () => HttpResponse.json({ items: [] })),
    http.put(apiUrl("/v1/admission/career/choice"), async ({ request }) => {
      const body = (await request.json()) as { majors: string[] }
      puts.push(body)
      return HttpResponse.json({ ...plan(body.majors), lock_version: 4 })
    }),
  )
  return quizzes
}

async function answerAll() {
  for (let i = 0; i < QUIZ.length; i++) {
    const next = await screen.findByRole("button", { name: i === QUIZ.length - 1 ? "See my majors" : "Next" })
    expect(next).toBeDisabled()
    fireEvent.click((await screen.findAllByRole("radio"))[0]!)
    await waitFor(() => expect(next).toBeEnabled())
    fireEvent.click(next)
  }
}

describe("career quiz", () => {
  test("recommend ranks by votes and ignores unavailable majors", () => {
    const answers = Object.fromEntries(QUIZ.map((q) => [q.id, q.options[0]!.key]))
    const all = recommend(
      answers,
      MAJORS.map((m) => m.code),
    )
    expect(all.length).toBeGreaterThan(0)
    expect(all.length).toBeLessThanOrEqual(3)
    expect(all[0]!.code).toBe("computer_science")
    expect(recommend(answers, ["biology"]).every((r) => r.code === "biology")).toBe(true)
    expect(
      recommend(
        {},
        MAJORS.map((m) => m.code),
      ),
    ).toEqual([])
  })

  test("walks ten single-choice questions with a progress bar", async () => {
    setup([])
    renderAdmissionApp(<CareerPage />)
    const bar = await screen.findByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getAllByRole("radio").length).toBe(4)
    fireEvent.click(screen.getAllByRole("radio")[0]!)
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled())
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2"))
    fireEvent.click(screen.getAllByRole("button", { name: "Back" }).at(-1)!)
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1"))
  })

  test("shows results, adds a major to the profile and redoes", async () => {
    const puts: unknown[] = []
    setup(puts)
    renderAdmissionApp(<CareerPage />)
    await answerAll()
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    const add = screen.getAllByRole("button", { name: "Add to profile" })
    expect(add.length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: "Find my colleges" })).toHaveAttribute("href", "/colleges/discover")
    fireEvent.click(add[0]!)
    await waitFor(() =>
      expect(puts).toEqual([{ majors: ["computer science".replace(" ", "_")], minors: [], lock_version: 3 }]),
    )
    expect(await screen.findByTestId("profile-majors")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Redo my recommendations" }))
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1"))
  })
})

describe("career quiz persistence", () => {
  test("restores finished results after a reload and clears them on redo", async () => {
    const store = setup([])
    const first = renderAdmissionApp(<CareerPage />)
    await answerAll()
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    await waitFor(() => expect(store.quizzes.career.completed).toBe(true))
    expect(Object.keys(store.quizzes.career.answers).length).toBe(QUIZ.length)
    first.unmount()
    renderAdmissionApp(<CareerPage />)
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Redo my recommendations" }))
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1"))
    await waitFor(() => expect(store.quizzes.career).toEqual({ answers: {}, completed: false }))
  })

  test("saves the intended study fields of the chooser catalog from the career page", async () => {
    const store = setup([])
    mockChooser()
    renderAdmissionApp(<CareerPage />, { route: "/career/?tab=field" })
    expect(screen.queryByRole("checkbox", { name: "Photography" })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole("button", { name: "Add a field" }))
    fireEvent.click(await screen.findByRole("button", { name: "Biology" }))
    expect(await screen.findByText("Autosaved")).toBeInTheDocument()
    expect(store.quizzes.career.answers.study_fields).toEqual(["biology"])
  })

  test("shows the saved career choice when there is no saved quiz", async () => {
    setup([])
    server.use(http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json(plan(["physics"]))))
    renderAdmissionApp(<CareerPage />)
    expect(await screen.findByTestId("profile-majors")).toBeInTheDocument()
  })
})

describe("career tabs and field counter", () => {
  test("the Field of study tab opens from the URL and counts study_focus", async () => {
    mockQuizzes()
    server.use(
      http.get(apiUrl("/v1/admission/career"), () =>
        HttpResponse.json({ ...plan(["data_science"]), study_focus: { field_ids: ["a", "b"], labels: ["A", "B"] } }),
      ),
      http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: MAJORS })),
    )
    mockChooser()
    renderAdmissionApp(<CareerPage />, {
      route: "/career/?tab=field",
      messages: { career: { nextActivities: "Find activities for {fields}" } },
    })
    expect(await screen.findByText("2 selected")).toBeTruthy()
    const cta = screen.getByRole("link", { name: "Find activities for A and B" })
    expect(cta.getAttribute("href")).toBe("/opportunities")
    expect(screen.getByRole("tab", { name: /Field of study/ }).getAttribute("aria-selected")).toBe("true")
  })

  const fieldPlan = (labels: string[]) => ({
    ...plan(["data_science"]),
    study_focus: { field_ids: labels.map((_, n) => `f${n}`), labels },
  })
  const copy = { career: { bannerActivities: "Find activities: {fields}" } }

  function finished(labels: string[]) {
    const quizzes = mockQuizzes()
    quizzes.quizzes.career = { answers: {}, completed: true }
    server.use(
      http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json(fieldPlan(labels))),
      http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: MAJORS })),
    )
  }

  test("ADM-TABS-1: the explore tab renders one tab bar, with the field badge on it", async () => {
    finished(["Computer Science"])
    renderAdmissionApp(<CareerPage />, { route: "/career/?tab=explore", messages: copy })
    await screen.findByTestId("profile-majors")
    expect(screen.getAllByRole("tablist")).toHaveLength(1)
    expect(screen.getAllByRole("tab", { name: /Field of study/ })).toHaveLength(1)
    expect(screen.getByRole("tab", { name: /Field of study/ }).textContent).toContain("1")
  })

  test("ADM-CAREER-CTA-1: the results link to activities for the chosen field", async () => {
    finished(["Computer Science"])
    renderAdmissionApp(<CareerPage />, { route: "/career/?tab=explore", messages: copy })
    const cta = await screen.findByRole("link", { name: "Find activities: Computer Science" })
    expect(cta.getAttribute("href")).toBe("/opportunities")
    expect(screen.getByRole("link", { name: "Find my colleges" })).toBeInTheDocument()
  })

  test("ADM-CAREER-CTA-2: two fields are joined as a locale list and keep their case", async () => {
    finished(["Computer Science", "Data Science"])
    renderAdmissionApp(<CareerPage />, { route: "/career/?tab=explore", messages: copy })
    expect(await screen.findByRole("link", { name: "Find activities: Computer Science and Data Science" })).toBeTruthy()
  })
})
