/** ADM-6–ADM-10, ADM-18, UF-ADM-04, UF-ADM-05, UF-ADM-07: groups, subjects, terms, timetable page, lessons. */
import { describe, expect, test } from "bun:test"
import {
  adminLessons,
  apiUrl,
  cancelledLesson,
  currentTerm,
  ids,
  selectDropdownValue,
  server,
  teacherNeededLesson,
} from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { GroupDetailPage } from "../features/groups/components/group-detail-page"
import { GroupsPage } from "../features/groups/components/groups-page"
import { LessonsPage } from "../features/lessons/components/lessons-page"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { TermsPage } from "../features/terms/components/terms-page"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, hrefOf, renderAdmin, setValue, setViewportWidth, waitUntil } from "./helpers"

configureTests()

describe("groups", () => {
  test("the list merges the statistics into each group", async () => {
    renderAdmin(<GroupsPage />, { route: "/groups/" })

    const link = await screen.findByRole("link", { name: "2TN2" })
    expect(hrefOf(link)).toBe(`/groups/view/?id=${ids.group2TN2}`)
    expect(await screen.findByText("97%")).toBeInTheDocument()
    expect(screen.getByText("4.10")).toBeInTheDocument()
    expect(screen.getByText("3/4")).toBeInTheDocument()
  })

  test("creating a group sends the name and EMIS id", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/groups"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: ids.group1TN1, name: "3TN1" })
      }),
    )
    const { user } = renderAdmin(<GroupsPage />, { route: "/groups/" })
    await screen.findByRole("link", { name: "2TN2" })

    await user.click(screen.getByRole("button", { name: "New group" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^Name/), "3TN1")
    setValue(within(dialog).getByLabelText(/^EMIS group ID/), "4001")
    await user.click(within(dialog).getByRole("button", { name: "Create group" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ name: "3TN1", emis_group_id: 4001 })
  })

  test("changing a subgroup is saved as one assignment", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl(`/v1/admin/groups/${ids.group2TN2}/subgroups`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: ids.group2TN2 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group2TN2}` })
    await screen.findByRole("heading", { name: "2TN2" })

    const save = screen.getByRole("button", { name: /Save subgroups/ })
    expect(save).toBeDisabled()
    await selectDropdownValue(user, await screen.findByLabelText("Subgroup of Qodirov Sardor"), "2")
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")
    await user.click(save)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ assignments: [{ user_id: ids.student4, subgroup: 2 }] })
  })

  test("the curator is set with the teacher picker", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/admin/groups/${ids.group2TN2}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: ids.group2TN2 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group2TN2}` })
    await screen.findByRole("heading", { name: "2TN2" })

    await selectDropdownValue(user, screen.getByLabelText("Curator"), ids.teacherRakhimov)
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ curator_id: ids.teacherRakhimov })
  })

  test("the name and the semester of a group can be changed", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/admin/groups/${ids.group2TN2}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: ids.group2TN2 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group2TN2}` })
    await screen.findByRole("heading", { name: "2TN2" })

    setValue(screen.getByLabelText("Name"), "2TN9")
    await selectDropdownValue(user, screen.getByLabelText("Semester"), "6")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ name: "2TN9", current_semester: 6 })
  })
})

describe("subjects", () => {
  test("lists the names in three languages and creates a subject", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/subjects"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: ids.math })
      }),
    )
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    expect(await screen.findByText("Ingliz tili")).toBeInTheDocument()
    expect(screen.getByText("Английский язык")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "New subject" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^Name in Uzbek/), "Biologiya")
    setValue(within(dialog).getByLabelText(/^Name in Russian/), "Биология")
    setValue(within(dialog).getByLabelText(/^Name in English/), "Biology")
    await user.click(within(dialog).getByRole("checkbox", { name: "Can be divided into subgroups" }))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ name: { uz: "Biologiya", ru: "Биология", en: "Biology" }, can_be_divided: true })
  })
})

describe("terms and bells", () => {
  test("shows the terms with their bell schedule", async () => {
    renderAdmin(<TermsPage />, { route: "/terms/" })

    expect(await screen.findByText("2026-2027, half 1")).toBeInTheDocument()
    expect(screen.getByText("Current")).toBeInTheDocument()
    expect(screen.getAllByText("1. 08:30–09:15")).toHaveLength(2)
    expect(screen.getByText("Non-study days: 1. Moved study days: 1.")).toBeInTheDocument()
  })

  test("an incomplete term is not saved and lists what is missing", async () => {
    let posted = false
    server.use(
      http.post(apiUrl("/v1/admin/terms"), () => {
        posted = true
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2026-2027, half 1")

    await user.click(screen.getByRole("button", { name: "New term" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    expect(await within(dialog).findByText("Enter the academic year.")).toBeInTheDocument()
    expect(within(dialog).getByText("Choose the start and end dates.")).toBeInTheDocument()
    expect(posted).toBe(false)
  })

  test("a bell with the start after the end is rejected", async () => {
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2026-2027, half 1")

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")
    const starts = within(dialog).getAllByLabelText("Start")[0] as HTMLElement
    setValue(starts, "10:00")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    expect(
      await within(dialog).findByText("Every period needs a start time that is before its end time."),
    ).toBeInTheDocument()
  })
})

describe("timetable page", () => {
  test("shows the weekday by period grid of the first group", async () => {
    renderAdmin(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByRole("columnheader", { name: "Monday" })).toBeInTheDocument()
    expect((await screen.findAllByRole("button", { name: /^Edit entry Mathematics/ })).length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Add an entry on Friday, period 6" })).toBeInTheDocument()
  })

  test("on a phone the grid becomes one card per weekday", async () => {
    setViewportWidth(360)
    try {
      renderAdmin(<TimetablePage />, { route: "/timetable/" })

      expect(await screen.findByRole("region", { name: "Monday" })).toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    } finally {
      setViewportWidth(1280)
    }
  })

  test("copying from another term sends both term ids", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/timetable/copy"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ created: 12 })
      }),
    )
    const { user } = renderAdmin(<TimetablePage />, { route: "/timetable/" })
    await screen.findByRole("columnheader", { name: "Monday" })

    await user.click(screen.getByRole("button", { name: "Copy from another term" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Copy timetable" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ from_term_id: ids.termPrevious, to_term_id: ids.term })
  })
})

describe("lessons", () => {
  test("lists lessons and marks the ones without a teacher or cancelled", async () => {
    const { user } = renderAdmin(<LessonsPage />, { route: "/lessons/" })

    expect((await screen.findAllByText("Cancelled")).length).toBeGreaterThan(0)
    await user.click(await screen.findByRole("button", { name: "Next page" }))
    expect((await screen.findAllByText("Teacher needed")).length).toBeGreaterThan(0)
    expect(adminLessons).toContain(teacherNeededLesson)
  })

  test("the teacher-needed filter in the URL is sent to the API", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/lessons"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("teacher_needed"))
        return HttpResponse.json({ items: [teacherNeededLesson], next_cursor: null })
      }),
    )
    renderAdmin(<LessonsPage />, { route: "/lessons/?teacher_needed=true" })

    await screen.findAllByText("Informatics")
    expect(seen).toContain("true")
  })

  test("cancelling a lesson sends only the changed field", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admin/lessons"), () =>
        HttpResponse.json({ items: [cancelledLesson, teacherNeededLesson], next_cursor: null }),
      ),
      http.patch(apiUrl(`/v1/admin/lessons/${teacherNeededLesson.id}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...teacherNeededLesson, status: "cancelled" })
      }),
    )
    const { user } = renderAdmin(<LessonsPage />, { route: "/lessons/" })
    await screen.findAllByText("Informatics")

    const buttons = screen.getAllByRole("button", { name: /^Change Informatics/ })
    await user.click(buttons[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")
    const save = within(dialog).getByRole("button", { name: "Save changes" })
    expect(save).toBeDisabled()
    await selectDropdownValue(user, within(dialog).getByLabelText("Status"), "cancelled")
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")
    await user.click(save)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ status: "cancelled" })
  })
})
