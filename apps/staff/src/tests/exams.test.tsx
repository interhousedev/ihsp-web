/** Exams (midterm and final controls): the group's controls by control week, the editor and the suggestions to confirm. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { StaffAssessmentItem } from "@ihsp/api"
import { apiUrl, assessmentIds, group1TN1, group2TN2, ids, problem, server, staffAssessments } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { useNav } from "../config/nav"
import { ExamsPage } from "../features/exams/components/exams-page"
import { ExamSuggestionsCard } from "../features/today/components/exam-suggestions-card"
import { TodayPage } from "../features/today/components/today-page"
import {
  CONTROLS,
  compareExams,
  groupBySection,
  inferControl,
  kindOfControl,
  newestFirst,
  statusOf,
  weekPeriods,
} from "../features/exams/utils/controls"
import { formValues, isEmptyPatch, toCreateBody, toPatchBody, valuesOfItem } from "../features/exams/utils/exam-form"
import { startsAtOf, timeOfStartsAt } from "../features/exams/utils/exam-time"
import { setDatePrefill } from "../features/exams/utils/editor-state"
import { subjectChoices, suggestionsByGroup, teachingGroups, teachingRange } from "../features/exams/utils/teaching"
import { configureTests, freezeTime, hrefOf, renderStaff, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

function item(id: string): StaffAssessmentItem {
  const found = staffAssessments.find((entry) => entry.id === id)
  if (!found) throw new Error(`fixture: no assessment ${id}`)
  return found
}

const math = item(assessmentIds.mathMidterm)
const physicsEmis = item(assessmentIds.physicsEmis)
const historyHead = item(assessmentIds.historyHead)
const englishWeek = item(assessmentIds.englishWeek)

function renderExams(route = "/group/exams/") {
  return renderStaff(<ExamsPage />, { route })
}

/** Records the JSON bodies of a write to the assessments, then lets the stateful test handler answer. */
function recordWrites(method: "post" | "patch", path = "/v1/staff/assessments"): unknown[] {
  const bodies: unknown[] = []
  server.use(
    http[method](apiUrl(path), async ({ request }) => {
      bodies.push(await request.clone().json())
    }),
  )
  return bodies
}

async function section(name: string): Promise<HTMLElement> {
  return screen.findByRole("region", { name })
}

async function suggestionsBlock(): Promise<HTMLElement> {
  return screen.findByRole("region", { name: /Suggested dates to confirm/ })
}

function rowOf(container: HTMLElement, subject: string): HTMLElement {
  const row = within(container)
    .getAllByRole("listitem")
    .find((entry) => within(entry).queryByText(subject, { selector: "span" }))
  if (!row) throw new Error(`no row for ${subject}`)
  return row
}

async function openDialog(): Promise<HTMLElement> {
  return screen.findByRole("dialog")
}

/** Picks a day of the month the calendar shows (October 2026 while the clock stands still). */
async function pickDay(user: UserEvent, dialog: HTMLElement, day: number) {
  await user.click(within(dialog).getByLabelText("Date"))
  await user.click(await screen.findByRole("button", { name: new RegExp(`October ${day}\\w*, 2026`) }))
}

/** A lesson with just the fields the exam helpers read. */
const lesson = (subjectId: string, name: string, groupId: string, subgroup: 1 | 2 | null) => ({
  subject: { id: subjectId, name, short_name: null },
  audience: [{ group_id: groupId, group_name: "x", subgroup }],
})

describe("exam helpers", () => {
  test("controls are grouped by control week in calendar order and empty weeks are left out", () => {
    const groups = groupBySection(staffAssessments)

    expect(groups.map((group) => group.section)).toEqual(["midterm_1", "midterm_2", "final", "other"])
    expect(groupBySection([math]).map((group) => group.section)).toEqual(["midterm_1"])
  })

  test("in a week the dated controls come first by day, then the weeks without a date by subject", () => {
    const midterm1 = groupBySection(staffAssessments).find((group) => group.section === "midterm_1")

    expect(midterm1?.items.map((entry) => entry.subject.short_name)).toEqual(["Chem", "Math", "Eng", "IT"])
    expect(compareExams(math, englishWeek)).toBeLessThan(0)
  })

  test("status: planned, tentative or a control week without a date", () => {
    expect(statusOf(math)).toBe("planned")
    expect(statusOf(physicsEmis)).toBe("tentative")
    expect(statusOf(englishWeek)).toBe("undated")
  })

  test("a control week fixes the kind", () => {
    expect(CONTROLS.map(kindOfControl)).toEqual(["midterm", "midterm", "final"])
  })

  test("the control week is inferred from the date when the list knows the weeks", () => {
    const periods = weekPeriods(staffAssessments)

    expect(inferControl("2026-10-14", periods)).toBe("midterm_1")
    expect(inferControl("2026-12-16", periods)).toBe("final")
    expect(inferControl("2026-10-21", periods)).toBeNull()
    expect(inferControl("", periods)).toBeNull()
  })

  test("suggestions are listed newest first, EMIS ones without a creation time by date", () => {
    const older = { ...historyHead, id: "a", created_at: "2026-09-01T05:00:00Z" }
    const newer = { ...physicsEmis, id: "b", created_at: "2026-09-30T05:00:00Z" }
    const unknown = { ...physicsEmis, id: "c", created_at: null, date: "2026-12-01" }

    expect(newestFirst([older, unknown, newer]).map((entry) => entry.id)).toEqual(["b", "a", "c"])
  })

  test("start time: Tashkent time of day to the ISO moment and back", () => {
    expect(startsAtOf("2026-10-14", "09:00")).toBe("2026-10-14T09:00:00+05:00")
    expect(startsAtOf("2026-10-14", "")).toBeNull()
    expect(startsAtOf("", "09:00")).toBeNull()
    expect(timeOfStartsAt("2026-10-14T04:00:00Z")).toBe("09:00")
    expect(timeOfStartsAt(null)).toBe("")
  })

  test("a new exam leaves out what is empty", () => {
    const values = formValues({ subjectId: ids.math, date: "2026-10-14", control: "midterm_1", room: "  " })

    expect(toCreateBody(ids.group2TN2, values)).toEqual({
      subject_id: ids.math,
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
      kind: "midterm",
      date: "2026-10-14",
      control: "midterm_1",
    })
  })

  test("an edit sends only what changed; cleared fields are null", () => {
    const initial = valuesOfItem(math)

    expect(toPatchBody(math, initial, initial)).toEqual({})
    expect(isEmptyPatch(toPatchBody(math, initial, initial))).toBe(true)
    expect(toPatchBody(math, initial, { ...initial, room: "305" })).toEqual({ room: "305" })
    expect(toPatchBody(math, initial, { ...initial, room: " ", note: "", time: "", control: "" })).toEqual({
      room: null,
      note: null,
      starts_at: null,
      control: null,
    })
  })

  test("a new date sends the start time again, on the new day", () => {
    const initial = valuesOfItem(math)

    expect(toPatchBody(math, initial, { ...initial, date: "2026-10-15" })).toEqual({
      date: "2026-10-15",
      starts_at: "2026-10-15T09:00:00+05:00",
    })
  })

  test("saving a suggestion confirms it even when nothing changed", () => {
    const initial = valuesOfItem(physicsEmis)

    expect(toPatchBody(physicsEmis, initial, initial)).toEqual({ status: "planned" })
    expect(toPatchBody(physicsEmis, initial, { ...initial, room: "101" })).toEqual({ room: "101", status: "planned" })
  })

  test("a subgroup change patches the audience of a single group", () => {
    const initial = valuesOfItem(math)

    expect(toPatchBody(math, initial, { ...initial, subgroup: "2" })).toEqual({
      audience: [{ group_id: ids.group2TN2, subgroup: 2 }],
    })
  })

  test("Set date keeps the subject, kind, control week and subgroup of the week", () => {
    expect(setDatePrefill(englishWeek)).toEqual({
      subjectId: ids.english,
      subgroup: "",
      kind: "midterm",
      control: "midterm_1",
    })
  })

  test("groups: curated and taught ones once each, by name", () => {
    const lessons = [
      { audience: [{ group_id: ids.group1TN1, group_name: "1TN1", subgroup: null }] },
      { audience: [{ group_id: ids.group2TN2, group_name: "2TN2", subgroup: 1 }] },
    ] as never

    expect(teachingGroups([group2TN2], lessons)).toEqual([
      { id: ids.group1TN1, name: "1TN1" },
      { id: ids.group2TN2, name: "2TN2" },
    ])
  })

  test("subjects of a group: the taught ones and those with a control; a half is kept when only one is taught", () => {
    const lessons = [
      lesson(ids.english, "English", ids.group2TN2, 1),
      lesson(ids.english, "English", ids.group2TN2, 1),
      lesson(ids.physics, "Physics", ids.group2TN2, null),
      lesson(ids.physics, "Physics", ids.group2TN2, 2),
      lesson(ids.chemistry, "Chemistry", ids.group1TN1, null),
    ] as never

    expect(subjectChoices(lessons, ids.group2TN2, [math])).toEqual([
      { id: ids.english, name: "English", subgroup: "1" },
      { id: ids.math, name: "Mathematics", subgroup: "" },
      { id: ids.physics, name: "Physics", subgroup: "" },
    ])
  })

  test("the timetable is read from this Monday for eight weeks", () => {
    expect(teachingRange("2026-10-07")).toEqual({ from: "2026-10-05", to: "2026-11-29" })
  })

  test("suggestions are counted per group", () => {
    expect(suggestionsByGroup([physicsEmis, historyHead]).get(ids.group2TN2)).toBe(2)
  })
})

describe("exams page", () => {
  test("lists the controls by control week with status and source", async () => {
    renderExams()

    const midterm1 = await section("Midterm 1")
    const rows = within(midterm1).getAllByRole("listitem")
    expect(rows.map((row) => within(row).getAllByText(/./, { selector: "span" })[0]?.textContent)).toEqual([
      "Chemistry",
      "Mathematics",
      "English",
      "Informatics",
    ])
    const mathRow = rowOf(midterm1, "Mathematics")
    expect(within(mathRow).getByText("Planned")).toBeInTheDocument()
    expect(within(mathRow).getByText("Teacher")).toBeInTheDocument()
    expect(mathRow).toHaveTextContent("14 Oct")
    expect(mathRow).toHaveTextContent("09:00")
    expect(mathRow).toHaveTextContent("Room 204")
    expect(mathRow).toHaveTextContent("Chapters 1–4; bring a calculator.")
    expect(within(await section("Midterm 2")).getByText("Not confirmed")).toBeInTheDocument()
    const final = await section("Final")
    expect(within(final).getByText("Administration")).toBeInTheDocument()
    expect(final).toHaveTextContent("Room Klaster")
    const other = await section("Other")
    expect(other).toHaveTextContent("Physics")
    expect(within(other).getByText("EMIS")).toBeInTheDocument()
  })

  test("a control week without a date says so and offers Set date", async () => {
    renderExams()

    const midterm1 = await section("Midterm 1")
    const row = rowOf(midterm1, "English")

    expect(within(row).getByText("Date not set")).toBeInTheDocument()
    expect(row).toHaveTextContent("Control week 12 Oct – 17 Oct")
    expect(within(row).getByRole("button", { name: "Set date: English" })).toBeInTheDocument()
    expect(within(row).queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument()
    expect(within(midterm1).getByText("12 Oct – 17 Oct", { selector: "span" })).toBeInTheDocument()
  })

  test("a suggestion shows where it came from, with the date and the note", async () => {
    renderExams()

    const block = await suggestionsBlock()
    const rows = within(block).getAllByRole("listitem")

    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent("History")
    expect(rows[0]).toHaveTextContent("Suggested by the head student")
    expect(rows[0]).toHaveTextContent("18 Nov")
    expect(rows[0]).toHaveTextContent("The head student suggests this date.")
    expect(rows[1]).toHaveTextContent("Physics")
    expect(rows[1]).toHaveTextContent("Mechanics")
    const origin = within(rows[1] as HTMLElement).getByRole("link", { name: "From EMIS lesson" })
    expect(hrefOf(origin)).toBe(`/lessons/view/?id=${encodeURIComponent(ids.lessonPhysicsToday)}`)
  })

  test("no suggestions block when nothing waits for confirmation", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/assessments"), () =>
        HttpResponse.json({ items: [staffAssessments.find((entry) => entry.id === math.id)] }),
      ),
    )
    renderExams()

    await section("Midterm 1")

    expect(screen.queryByRole("region", { name: /Suggested dates to confirm/ })).not.toBeInTheDocument()
  })

  test("Confirm as is sends only the planned status and moves the control to its week", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const block = await suggestionsBlock()
    await user.click(within(block).getByRole("button", { name: "Confirm as is: Physics" }))

    await waitFor(() => expect(bodies).toEqual([{ status: "planned" }]))
    await waitFor(() => expect(within(block).queryByText("Physics")).not.toBeInTheDocument())
    expect(within(await section("Other")).getByText("Planned")).toBeInTheDocument()
  })

  test("a row of the list confirms a suggestion too", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const other = await section("Other")
    await user.click(within(other).getByRole("button", { name: "Confirm Physics" }))

    await waitFor(() => expect(bodies).toEqual([{ status: "planned" }]))
  })

  test("Dismiss asks first; keeping changes nothing", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const block = await suggestionsBlock()
    await user.click(within(block).getByRole("button", { name: "Dismiss: History" }))
    const ask = await screen.findByRole("alertdialog")
    expect(within(ask).getByText("Dismiss this suggestion?")).toBeInTheDocument()
    expect(within(ask).getByText(/History, 18 November/)).toBeInTheDocument()
    expect(bodies).toEqual([])
    await user.click(within(ask).getByRole("button", { name: "Keep" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(bodies).toEqual([])
    expect(within(block).getByText("History")).toBeInTheDocument()
  })

  test("Dismiss, once confirmed, sends the cancelled status and the suggestion is gone", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const block = await suggestionsBlock()
    await user.click(within(block).getByRole("button", { name: "Dismiss: History" }))
    const ask = await screen.findByRole("alertdialog")
    await user.click(within(ask).getByRole("button", { name: "Dismiss" }))

    await waitFor(() => expect(bodies).toEqual([{ status: "cancelled" }]))
    await waitFor(() => expect(screen.queryByRole("region", { name: "Midterm 2" })).not.toBeInTheDocument())
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  test("a planned exam is cancelled after a confirmation", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Cancel exam: Mathematics" }))
    const ask = await screen.findByRole("alertdialog")
    expect(within(ask).getByText("Cancel this exam?")).toBeInTheDocument()
    await user.click(within(ask).getByRole("button", { name: "Cancel exam" }))

    await waitFor(() => expect(bodies).toEqual([{ status: "cancelled" }]))
  })

  test("Edit and confirm opens the editor; saving sends the changes and confirms", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const block = await suggestionsBlock()
    await user.click(within(block).getByRole("button", { name: "Edit and confirm: Physics" }))
    const dialog = await openDialog()
    expect(within(dialog).getByRole("heading", { name: "Edit and confirm" })).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Subject")).toBeDisabled()
    setValue(within(dialog).getByLabelText("Room"), "301")
    await user.click(within(dialog).getByRole("button", { name: "Save and confirm" }))

    await waitFor(() => expect(bodies).toEqual([{ room: "301", status: "planned" }]))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("editing a planned exam sends only the changed field", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Edit Mathematics" }))
    const dialog = await openDialog()
    expect(within(dialog).getByRole("heading", { name: "Edit exam" })).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Room")).toHaveValue("204")
    expect(within(dialog).getByLabelText("Start time")).toHaveValue("09:00")
    expect(within(dialog).getByLabelText("Title")).toHaveValue("Algebra and functions")
    setValue(within(dialog).getByLabelText("Room"), "305")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toEqual([{ room: "305" }]))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(rowOf(await section("Midterm 1"), "Mathematics")).toHaveTextContent("Room 305")
  })

  test("clearing the room sends null", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Edit Mathematics" }))
    const dialog = await openDialog()
    setValue(within(dialog).getByLabelText("Room"), "")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toEqual([{ room: null }]))
  })

  test("saving an unchanged exam sends nothing and closes the editor", async () => {
    const bodies = recordWrites("patch", "/v1/staff/assessments/:id")
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Edit Mathematics" }))
    const dialog = await openDialog()
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(bodies).toEqual([])
  })

  test("a new exam is created for the group with the control week inferred from the date", async () => {
    const bodies = recordWrites("post")
    const { user } = renderExams()

    await section("Midterm 1")
    await user.click(screen.getByRole("button", { name: "Add exam" }))
    const dialog = await openDialog()
    expect(within(dialog).getByRole("heading", { name: "Add exam" })).toBeInTheDocument()
    await user.selectOptions(within(dialog).getByLabelText("Subject"), ids.physics)
    await pickDay(user, dialog, 15)
    setValue(within(dialog).getByLabelText("Start time"), "14:30")
    setValue(within(dialog).getByLabelText("Room"), "101")
    setValue(within(dialog).getByLabelText("Note for students"), "Bring a calculator")

    expect(within(dialog).getByLabelText("Control week")).toHaveValue("midterm_1")
    expect(within(dialog).getByLabelText("Kind")).toHaveValue("midterm")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          subject_id: ids.physics,
          audience: [{ group_id: ids.group2TN2, subgroup: null }],
          kind: "midterm",
          date: "2026-10-15",
          starts_at: "2026-10-15T14:30:00+05:00",
          room: "101",
          note: "Bring a calculator",
          control: "midterm_1",
        },
      ]),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(rowOf(await section("Midterm 1"), "Physics")).toHaveTextContent("Room 101")
  })

  test("an exam for one subgroup is created for that subgroup", async () => {
    const bodies = recordWrites("post")
    const { user } = renderExams()

    await section("Midterm 1")
    await user.click(screen.getByRole("button", { name: "Add exam" }))
    const dialog = await openDialog()
    await user.selectOptions(within(dialog).getByLabelText("Subject"), ids.history)
    await user.selectOptions(within(dialog).getByLabelText("Audience"), "2")
    await user.selectOptions(within(dialog).getByLabelText("Kind"), "other")
    await pickDay(user, dialog, 30)
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          subject_id: ids.history,
          audience: [{ group_id: ids.group2TN2, subgroup: 2 }],
          kind: "other",
          date: "2026-10-30",
        },
      ]),
    )
  })

  test("the form asks for a subject and a date before it sends anything", async () => {
    const bodies = recordWrites("post")
    const { user } = renderExams()

    await section("Midterm 1")
    await user.click(screen.getByRole("button", { name: "Add exam" }))
    const dialog = await openDialog()
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByText("Choose a subject.")).toBeInTheDocument()
    expect(within(dialog).getByText("Choose a date.")).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  test("the note is limited to 2000 characters", async () => {
    const bodies = recordWrites("post")
    const { user } = renderExams()

    await section("Midterm 1")
    await user.click(screen.getByRole("button", { name: "Add exam" }))
    const dialog = await openDialog()
    await user.selectOptions(within(dialog).getByLabelText("Subject"), ids.physics)
    await pickDay(user, dialog, 15)
    const note = within(dialog).getByLabelText("Note for students")
    note.removeAttribute("maxlength")
    setValue(note, "x".repeat(2001))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByText("The note can have up to 2000 characters.")).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  test("Set date on a control week opens the editor with the subject, kind and control week and creates the exam", async () => {
    const bodies = recordWrites("post")
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Set date: English" }))
    const dialog = await openDialog()
    expect(within(dialog).getByRole("heading", { name: "Set exam date" })).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Subject")).toHaveValue(ids.english)
    expect(within(dialog).getByLabelText("Control week")).toHaveValue("midterm_1")
    expect(within(dialog).getByLabelText("Kind")).toHaveValue("midterm")
    expect(within(dialog).getByText("Control week: 12 Oct – 17 Oct")).toBeInTheDocument()
    await pickDay(user, dialog, 14)
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          subject_id: ids.english,
          audience: [{ group_id: ids.group2TN2, subgroup: null }],
          kind: "midterm",
          date: "2026-10-14",
          control: "midterm_1",
        },
      ]),
    )
  })

  test("a refusal of the backend is shown in the editor in the user's language", async () => {
    server.use(
      http.patch(apiUrl("/v1/staff/assessments/:id"), () =>
        problem(403, "academic/not-assessment-teacher", "Only a teacher of the subject may do this"),
      ),
    )
    const { user } = renderExams()

    const midterm1 = await section("Midterm 1")
    await user.click(within(midterm1).getByRole("button", { name: "Edit Mathematics" }))
    const dialog = await openDialog()
    setValue(within(dialog).getByLabelText("Room"), "305")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Only a teacher of this subject in this group or Administration can do this.",
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("a refused confirmation is shown on the page", async () => {
    server.use(
      http.patch(apiUrl("/v1/staff/assessments/:id"), () =>
        problem(403, "academic/not-assessment-teacher", "Only a teacher of the subject may do this"),
      ),
    )
    const { user } = renderExams()

    const block = await suggestionsBlock()
    await user.click(within(block).getByRole("button", { name: "Confirm as is: Physics" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only a teacher of this subject in this group or Administration can do this.",
    )
  })

  test("the subject filter limits the list to one subject", async () => {
    const { user } = renderExams()

    await section("Midterm 1")
    await user.selectOptions(screen.getByLabelText("Subject"), ids.math)

    await waitFor(() => expect(screen.queryByRole("region", { name: "Midterm 2" })).not.toBeInTheDocument())
    expect(rowOf(await section("Midterm 1"), "Mathematics")).toBeInTheDocument()
    expect(within(await section("Midterm 1")).queryByText("English")).not.toBeInTheDocument()
    expect(within(await section("Final")).getByText("Mathematics")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: /Suggested dates to confirm/ })).not.toBeInTheDocument()
  })

  test("the subject filter is kept in the address", async () => {
    renderExams(`/group/exams/?subject=${ids.history}`)

    expect(await section("Midterm 2")).toHaveTextContent("History")
    expect(screen.queryByRole("region", { name: "Final" })).not.toBeInTheDocument()
  })

  test("a group without controls says so and still offers Add exam", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([group2TN2, group1TN1])))
    const { user } = renderExams()

    const picker = await screen.findByRole("combobox", { name: "Group" })
    await user.selectOptions(picker, ids.group1TN1)

    expect(await screen.findByText("No exams for this group yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add exam" })).toBeInTheDocument()
  })

  test("the group picker tells how many suggested dates wait in each group", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([group2TN2, group1TN1])))
    renderExams()

    const picker = await screen.findByRole("combobox", { name: "Group" })

    await waitFor(() =>
      expect(
        within(picker)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["1TN1", "2TN2 (2 to confirm)"]),
    )
  })

  test("?group= opens that group", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([group2TN2, group1TN1])))
    renderExams(`/group/exams/?group=${ids.group1TN1}`)

    expect(await screen.findByText("No exams for this group yet.")).toBeInTheDocument()
  })

  test("a teacher who curates no group still sees the groups they teach", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([])))
    renderExams()

    expect(await section("Midterm 1")).toBeInTheDocument()
  })

  test("a teacher without any group is told so", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([])),
      http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([])),
    )
    renderExams()

    expect(await screen.findByText("You do not teach any group yet.")).toBeInTheDocument()
  })
})

function NavTitles() {
  const nav = useNav()
  return (
    <ul aria-label="sidebar">
      {nav.groups
        .flatMap((group) => group.items)
        .map((entry) => (
          <li key={entry.url}>
            <a href={entry.url}>{entry.title}</a>
          </li>
        ))}
    </ul>
  )
}

describe("navigation", () => {
  test("every teacher gets Exams, also one who curates no group", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([])))
    renderStaff(<NavTitles />)

    const link = await screen.findByRole("link", { name: "Exams" })

    expect(hrefOf(link)).toBe("/group/exams/")
    await waitFor(() => expect(screen.queryByRole("link", { name: "Students" })).not.toBeInTheDocument())
  })
})

describe("Today card", () => {
  test("tells how many exam dates wait for confirmation and links to the group's exams", async () => {
    renderStaff(<ExamSuggestionsCard />)

    expect(await screen.findByText("2 exam dates to confirm")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Review" })
    expect(hrefOf(link)).toBe(`/group/exams/?group=${ids.group2TN2}`)
  })

  test("it is part of the Today page", async () => {
    renderStaff(<TodayPage />)

    expect(await screen.findByText("2 exam dates to confirm")).toBeInTheDocument()
  })

  test("it is not shown when nothing waits for confirmation", async () => {
    let asked = 0
    server.use(
      http.get(apiUrl("/v1/staff/assessments"), () => {
        asked += 1
        return HttpResponse.json({ items: [] })
      }),
    )
    renderStaff(<TodayPage />)

    await screen.findByText("Next lesson")
    await waitFor(() => expect(asked).toBe(1))

    expect(screen.queryByText(/exam dates? to confirm/)).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Review" })).not.toBeInTheDocument()
  })

  test("it asks for the suggestions only", async () => {
    const asked: URL[] = []
    server.use(
      http.get(apiUrl("/v1/staff/assessments"), ({ request }) => {
        asked.push(new URL(request.url))
      }),
    )
    renderStaff(<ExamSuggestionsCard />)

    await waitFor(() => expect(asked.length).toBeGreaterThan(0))

    expect(asked[0]?.searchParams.get("status")).toBe("tentative")
    expect(asked[0]?.searchParams.get("undated")).toBeNull()
  })
})
