/** The student profile opened directly, its subject filter in the URL, and the two group pages that link to it. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { group2TN2, ids, journal, journalOptions } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactElement } from "react"
import { StudentsPage } from "../features/group/components/students-page"
import { StudentProfile } from "../features/students/student-profile"
import { GroupPage } from "../features/subjects/components/group-page"
import { subjectGroupHref, subjectStudentHref } from "../features/subjects/utils/hrefs"
import { configureTests, freezeTime, hrefOf, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const first = journal.students[0]
if (!first) throw new Error("fixture: no journal student")
const [physics, english] = journalOptions
if (!physics || !english) throw new Error("fixture: two journal options expected")

/** The URL query the page writes, captured through the nuqs testing adapter. */
function captureUrl(ui: ReactElement, search: string): { element: ReactElement; urls: URLSearchParams[] } {
  const urls: URLSearchParams[] = []
  const element = (
    <NuqsTestingAdapter
      hasMemory
      searchParams={search}
      onUrlUpdate={(event) => {
        urls.push(new URLSearchParams(event.queryString))
      }}
    >
      {ui}
    </NuqsTestingAdapter>
  )
  return { element, urls }
}

describe("STF-9 student profile opened directly", () => {
  test("the address /students/view with only the student shows the whole profile", async () => {
    renderStaff(<StudentProfile />, { route: `/students/view/?id=${first.user_id}` })

    expect(await screen.findByRole("heading", { name: `${first.last_name} ${first.first_name}` })).toBeInTheDocument()
    expect(within(await screen.findByTestId("marks-by-subject")).getAllByRole("listitem")).toHaveLength(
      journalOptions.length,
    )
    expect(screen.getByTestId("attendance-summary")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All subjects" })).toHaveAttribute("aria-pressed", "true")
  })

  test("a student id that is not one of the teacher's students shows not found", async () => {
    renderStaff(<StudentProfile />, { route: `/students/view/?id=${ids.teacherRakhimov}` })

    expect(await screen.findByText("This student was not found among your groups.")).toBeInTheDocument()
    expect(screen.queryByTestId("marks-by-subject")).toBeNull()
  })
})

describe("STF-9 subject filter on the student profile", () => {
  test("choosing a subject narrows the marks to that subject and writes it to the URL", async () => {
    const { element, urls } = captureUrl(<StudentProfile />, `?id=${first.user_id}`)
    const { user } = renderStaff(element, { route: `/students/view/?id=${first.user_id}` })

    const marks = await screen.findByTestId("marks-by-subject")
    expect(within(marks).getAllByRole("listitem")).toHaveLength(journalOptions.length)

    await user.click(await screen.findByRole("button", { name: english.subject.name }))

    await waitFor(() => expect(within(screen.getByTestId("marks-by-subject")).getAllByRole("listitem")).toHaveLength(1))
    const narrowed = screen.getByTestId("marks-by-subject")
    expect(within(narrowed).getByText(new RegExp(`^${english.subject.name} · `))).toBeInTheDocument()
    expect(within(narrowed).queryByText(new RegExp(`^${physics.subject.name} · `))).toBeNull()
    expect(urls.at(-1)?.get("subject")).toBe(english.subject.id)
    expect(screen.getByRole("button", { name: english.subject.name })).toHaveAttribute("aria-pressed", "true")
  })

  test("a profile opened with the subject in the URL is already filtered", async () => {
    renderStaff(<StudentProfile />, {
      route: `/students/view/?id=${first.user_id}&subject=${physics.subject.id}`,
    })

    const marks = await screen.findByTestId("marks-by-subject")
    expect(within(marks).getAllByRole("listitem")).toHaveLength(1)
    expect(within(marks).getByText(new RegExp(`^${physics.subject.name} · `))).toBeInTheDocument()
    expect(screen.getByRole("button", { name: physics.subject.name })).toHaveAttribute("aria-pressed", "true")
  })

  test("All subjects clears the filter again", async () => {
    const { user } = renderStaff(<StudentProfile />, {
      route: `/students/view/?id=${first.user_id}&subject=${english.subject.id}`,
    })
    expect(within(await screen.findByTestId("marks-by-subject")).getAllByRole("listitem")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "All subjects" }))

    await waitFor(() =>
      expect(within(screen.getByTestId("marks-by-subject")).getAllByRole("listitem")).toHaveLength(
        journalOptions.length,
      ),
    )
  })
})

describe("UF-STF-09 group pages share the header and the student list", () => {
  test("a taught group lists its students as links to the profile", async () => {
    renderStaff(<GroupPage />, { route: subjectGroupHref(ids.math, ids.group2TN2) })

    const section = (await screen.findByRole("heading", { name: "Students (4)" })).closest("section") as HTMLElement
    const links = within(section).getAllByRole("link")
    expect(links).toHaveLength(4)
    expect(hrefOf(within(section).getByRole("link", { name: /Ismoilov Jasur/ }))).toBe(
      subjectStudentHref(ids.math, ids.group2TN2, null, ids.student2),
    )
  })

  test("a taught group's student link opens the profile for that subject and group", async () => {
    renderStaff(<GroupPage />, { route: subjectGroupHref(ids.math, ids.group2TN2) })
    const section = (await screen.findByRole("heading", { name: "Students (4)" })).closest("section") as HTMLElement
    const href = hrefOf(within(section).getByRole("link", { name: /Ismoilov Jasur/ }))

    renderStaff(<StudentProfile />, { route: href })

    expect(await screen.findByRole("heading", { name: "Ismoilov Jasur" })).toBeInTheDocument()
  })

  test("the curator's group shows its name in the header and every student in the list", async () => {
    renderStaff(<StudentsPage />)

    expect(await screen.findByRole("heading", { name: group2TN2.name })).toBeInTheDocument()
    const list = await screen.findByRole("list")
    expect(within(list).getAllByRole("button")[0]).toHaveTextContent(first.last_name)
  })

  test("UF-STF-09 the student card links to the student profile in this group", async () => {
    const { user } = renderStaff(<StudentsPage />)

    await user.click(await screen.findByRole("button", { name: /Brastilov Aleksey/ }))

    const link = await screen.findByRole("link", { name: "Open profile" })
    expect(hrefOf(link)).toMatch(new RegExp(`^/students/view/\\?id=[^&]+&group=${group2TN2.id}$`))
  })
})
