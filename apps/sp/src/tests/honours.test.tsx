/** Honours page, planner paths and the rating-book button. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { mergeMessages } from "@ihsp/i18n"
import type { PlannerTarget } from "@ihsp/api"
import { apiUrl, honoursEligible, ids, plannerMath, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { GradesPage } from "../features/grades/components/grades-page"
import { PlannerPage } from "../features/grades/planner/components/planner-page"
import { HonoursPage } from "../features/honours/components/honours-page"
import honoursEn from "../../messages/en/honours.json"
import honoursRu from "../../messages/ru/honours.json"
import honoursUz from "../../messages/uz/honours.json"
import en from "../../messages/en.json"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(unfreezeTime)

const messages = mergeMessages(en, honoursEn)

const keys = (value: unknown, prefix = ""): string[] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
    : [prefix]

describe("HON-1 honours page", () => {
  test("a blocked award lists the failed rule and the marks that block it", async () => {
    renderSp(<HonoursPage />, { route: "/honours/", messages })

    const red = within(await screen.findByTestId("honours-award-red_diploma"))
    expect(red.getByText("Not eligible")).toBeTruthy()
    const rule = within(red.getByTestId("honours-rule-red_diploma_max_fours"))
    expect(rule.getByText(/Mathematics/)).toBeTruthy()
    expect(rule.getByText(/Physics/)).toBeTruthy()
    expect(rule.getByText(/midterm \(PC\)/)).toBeTruthy()
    expect(screen.getByTestId("honours-serial")).toHaveTextContent("AB 1234567")
    expect(within(screen.getByTestId("honours-award-silver_medal")).getByText("Eligible")).toBeTruthy()
  })

  test("eligible awards and a missing certificate serial", async () => {
    server.use(http.get(apiUrl("/v1/me/honours"), () => HttpResponse.json(honoursEligible)))
    renderSp(<HonoursPage />, { route: "/honours/", messages })

    await screen.findByTestId("honours-award-gold_medal")
    expect(screen.getAllByText("Eligible")).toHaveLength(3)
    expect(screen.getByTestId("honours-serial")).toHaveTextContent(/EMIS/)
  })

  test("uz, ru and en have the same keys", () => {
    expect(keys(honoursRu).sort()).toEqual(keys(honoursEn).sort())
    expect(keys(honoursUz).sort()).toEqual(keys(honoursEn).sort())
  })
})

describe("HON-2 planner paths", () => {
  const needed: PlannerTarget = {
    grade: 5,
    threshold: 4.5,
    status: "needed",
    control: null,
    min_value: null,
    min_both: null,
    pairs: [],
    paths: [
      { extra_lesson_fives: 2, midterm: null, final: 4 },
      { extra_lesson_fives: 0, midterm: 5, final: 5 },
    ],
  }

  test("a target shows how to reach it as sentences", async () => {
    server.use(
      http.get(apiUrl("/v1/me/subjects/:subjectId/planner"), () =>
        HttpResponse.json({ ...plannerMath, targets: [needed] }),
      ),
    )
    renderSp(<PlannerPage />, { route: `/grades/plan/?subject=${ids.math}` })

    const list = await screen.findByTestId("planner-paths")
    expect(list).toHaveTextContent("Get 2 more fives on lessons and at least 4 on the final (FC).")
    expect(list).toHaveTextContent(/Or get at least 5 on the remaining midterm \(PC\) and at least 5 on the final/)
  })
})

describe("HON-3 rating book button", () => {
  test("opens the tab in the click, then points it at the link", async () => {
    const tab = { location: { href: "" }, close: () => {}, opener: {} }
    const open = spyOn(window, "open").mockImplementation((() => tab) as unknown as typeof window.open)
    renderSp(<GradesPage />, { route: "/grades/" })

    fireEvent.click(await screen.findByRole("button", { name: "Rating book (PDF)" }))

    expect(open).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(tab.location.href).toBe("https://emis.example/rating-book.pdf"))
    open.mockRestore()
  })

  test("a failed request closes the tab and shows an error", async () => {
    let closed = false
    const tab = { location: { href: "" }, close: () => (closed = true), opener: {} }
    const open = spyOn(window, "open").mockImplementation((() => tab) as unknown as typeof window.open)
    const error = spyOn(toast, "error").mockImplementation(() => "")
    server.use(http.get(apiUrl("/v1/me/emis/rating-book"), () => HttpResponse.error()))
    renderSp(<GradesPage />, { route: "/grades/" })

    fireEvent.click(await screen.findByRole("button", { name: "Rating book (PDF)" }))

    await waitFor(() => expect(error).toHaveBeenCalled())
    expect(closed).toBe(true)
    open.mockRestore()
    error.mockRestore()
  })
})
