import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CareerPage } from "./components/career-page"
import { CareerQuizButton } from "./components/career-quiz-dialog"
import { mockChooser } from "../../tests/chooser-handlers"
import { mockQuizzes } from "../../tests/quiz-handlers"
import { IKIGAI_QUESTIONS } from "./ikigai-questions"
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

let ikigai = { love: [] as string[], good_at: [] as string[], needs: [] as string[], paid: [] as string[] }

function setup(puts: unknown[]) {
  ikigai = { love: [], good_at: [], needs: [], paid: [] }
  const quizzes = mockQuizzes()
  server.use(
    http.get(apiUrl("/v1/admission/me/ikigai"), () => HttpResponse.json(ikigai)),
    http.put(apiUrl("/v1/admission/me/ikigai"), async ({ request }) => {
      ikigai = (await request.json()) as typeof ikigai
      return HttpResponse.json(ikigai)
    }),
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

const FINISHED = Object.fromEntries(QUIZ.map((q) => [q.id, q.options[0]!.key]))

async function openQuiz() {
  fireEvent.click(await screen.findByRole("button", { name: "Take the test (5 min)" }))
}

const submit = () => document.querySelector<HTMLButtonElement>("button[type=submit]")!

/** Every question of the questionnaire in order: the cards of the major vote, then one chip (or card) per ikigai step. */
async function answerAll() {
  for (let i = 0; i < QUIZ.length + IKIGAI_QUESTIONS.length; i++) {
    if (IKIGAI_QUESTIONS[i - QUIZ.length]?.id !== "people") expect(submit()).toBeDisabled()
    const field = i < QUIZ.length || IKIGAI_QUESTIONS[i - QUIZ.length]!.kind === "single" ? "radio" : "checkbox"
    fireEvent.click((await screen.findAllByRole(field))[0]!)
    await waitFor(() => expect(submit()).toBeEnabled())
    fireEvent.click(submit())
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
    renderAdmissionApp(<CareerQuizButton />)
    await openQuiz()
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

  test("the test finishes from the button and stores the answers", async () => {
    const store = setup([])
    renderAdmissionApp(<CareerQuizButton />)
    await openQuiz()
    await answerAll()
    await waitFor(() => expect(store.quizzes.career.completed).toBe(true))
    // Ten vote answers, ten ikigai answers, and the empty free-text line of the last question.
    expect(Object.keys(store.quizzes.career.answers).length).toBe(QUIZ.length + IKIGAI_QUESTIONS.length + 1)
    expect(ikigai.love.length).toBeGreaterThan(0)
    expect(ikigai.paid.length).toBeGreaterThan(0)
  }, 20000)

  test("a finished test shows results on the field page and adds a major to the profile", async () => {
    const puts: unknown[] = []
    const store = setup(puts)
    store.quizzes.career = { answers: FINISHED, completed: true }
    renderAdmissionApp(<CareerPage />)
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    const add = screen.getAllByRole("button", { name: "Add to profile" })
    fireEvent.click(add[0]!)
    await waitFor(() =>
      expect(puts).toEqual([{ majors: ["computer science".replace(" ", "_")], minors: [], lock_version: 3 }]),
    )
    expect(await screen.findByTestId("profile-majors")).toBeInTheDocument()
  })
})

describe("career quiz persistence", () => {
  test("redo clears the stored answers", async () => {
    const store = setup([])
    store.quizzes.career = { answers: FINISHED, completed: true }
    renderAdmissionApp(<CareerPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Redo my recommendations" }))
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

  test("ADM-TABS-1: the field page renders one tab bar, with the field tab on it", async () => {
    finished(["Computer Science"])
    renderAdmissionApp(<CareerPage />, { route: "/career/?tab=explore", messages: copy })
    await screen.findByTestId("profile-majors")
    expect(screen.getAllByRole("tablist")).toHaveLength(1)
    expect(screen.getAllByRole("tab", { name: /Field of study/ })).toHaveLength(1)
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
