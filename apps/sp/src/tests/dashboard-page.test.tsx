/** The Dashboard (the landing page): today's lessons with marks and notebook links, the GPA and links to every section. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { getConfig } from "@ihsp/config"
import { apiUrl, server, studentToday, todayLessons } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { DashboardPage } from "../features/dashboard/components/dashboard-page"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const [first, second] = todayLessons as [(typeof todayLessons)[number], (typeof todayLessons)[number]]

/** The address without the trailing slash `next/link` may drop (`/a/?x` and `/a?x` are the same page). */
function hrefOf(link: HTMLElement): string {
  return (link.getAttribute("href") ?? "").replace(/\/(\?|$)/, "$1")
}

function useLessons(lessons: unknown[], results: unknown[] = []) {
  server.use(
    http.get(apiUrl("/v1/me/timetable"), () => HttpResponse.json(lessons)),
    http.get(apiUrl("/v1/me/lesson-results"), () => HttpResponse.json(results)),
  )
}

describe("Dashboard", () => {
  test("lists today's lessons with marks, a lesson link and a notebook link each", async () => {
    useLessons(
      [first, { ...second, subgroup: { subgroup_id: 2, subgroup_name: "Group B", is_own_subgroup: false } }],
      [{ lesson_id: first.id, attendance: "present", mark: 5 }],
    )
    renderSp(<DashboardPage />)

    const list = await screen.findByRole("list", { name: "Today's lessons" })
    const rows = within(list).getAllByRole("listitem")
    expect(rows).toHaveLength(2)

    const lessonLink = within(rows[0]!).getAllByRole("link")[0]!
    expect(lessonLink).toHaveTextContent(first.subject.name)
    expect(hrefOf(lessonLink)).toBe(`/lessons/view?id=${encodeURIComponent(first.id)}`)
    expect(within(rows[0]!).getByLabelText("Mark 5")).toBeInTheDocument()

    const notebook = within(rows[0]!).getByRole("link", { name: `Notebook: ${first.subject.name}` })
    expect(notebook.tagName).toBe("A")
    expect(hrefOf(notebook)).toBe(`/notebooks/view?subject=${encodeURIComponent(first.subject.id)}`)

    expect(within(rows[1]!).getByText("Other subgroup (Group B)")).toBeInTheDocument()
    expect(rows[1]!.getAttribute("data-other-subgroup")).toBe("true")
  })

  test("says so when there are no lessons today", async () => {
    useLessons([])
    renderSp(<DashboardPage />)

    expect(await screen.findByText("No lessons today")).toBeInTheDocument()
  })

  test("shows an error with a retry when the lessons fail", async () => {
    server.use(http.get(apiUrl("/v1/me/timetable"), () => HttpResponse.json({}, { status: 500 })))
    renderSp(<DashboardPage />)

    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument()
  })

  test("shows the GPA on the 5-point scale with a link to Grades", async () => {
    useLessons([])
    server.use(
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({ ...studentToday, semester: { ...studentToday.semester, gpa: 4.37 } }),
      ),
    )
    renderSp(<DashboardPage />)

    const gpa = await screen.findByRole("link", { name: /GPA/ })
    expect(gpa).toHaveTextContent("4.37")
    expect(gpa).toHaveTextContent("/ 5")
    expect(hrefOf(gpa)).toBe("/grades")
  })

  test("links to every section and to the external apps", async () => {
    useLessons([])
    renderSp(<DashboardPage />)

    const nav = await screen.findByRole("navigation", { name: "All sections" })
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => hrefOf(link))
    for (const href of [
      "/today",
      "/timetable",
      "/homework",
      "/grades",
      "/subjects",
      "/notebooks",
      "/assistant",
      "/flashcards",
      "/exams",
      "/files",
      "/mail",
      "/settings",
    ]) {
      expect(hrefs).toContain(href)
    }
    expect(within(nav).getByRole("link", { name: "Library" }).getAttribute("href")).toBe(
      getConfig().LIBRARY_URL ?? "https://lib.ihsu.uz",
    )
    expect(within(nav).getByRole("link", { name: "LMS" }).getAttribute("href")).toBe(getConfig().LMS_URL)
    expect(hrefs).not.toContain("")
  })
})
