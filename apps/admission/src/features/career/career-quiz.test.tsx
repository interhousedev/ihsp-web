import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CareerPage } from "./components/career-page"
import { QUIZ, recommend } from "./quiz"

afterEach(() => window.localStorage.clear())

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
    setup([])
    const first = renderAdmissionApp(<CareerPage />)
    await answerAll()
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    expect(Object.keys(window.localStorage).some((k) => k.startsWith("admission.career.quiz."))).toBe(true)
    first.unmount()
    renderAdmissionApp(<CareerPage />)
    expect(await screen.findByText("Here's what might be your thing")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Redo my recommendations" }))
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1"))
    expect(Object.keys(window.localStorage).some((k) => k.startsWith("admission.career.quiz."))).toBe(false)
  })

  test("shows the saved career choice when there is no saved quiz", async () => {
    setup([])
    server.use(http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json(plan(["physics"]))))
    renderAdmissionApp(<CareerPage />)
    expect(await screen.findByTestId("profile-majors")).toBeInTheDocument()
  })
})
