/**
 * EXAM-2, EXAM-3, UF-ADM-10: what Administration does with the exams: confirm or dismiss a date, edit one, give a
 * control week its date, add an exam, and export the list.
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { apiUrl, assessmentIds, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { ExamsPage } from "../features/exams/components/exams-page"
import { watchExamRequests, type ExamWatcher } from "./exam-helpers"
import { configureTests, pickDate, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

let watcher: ExamWatcher
beforeEach(() => {
  watcher = watchExamRequests()
})
afterEach(() => watcher.stop())

function table(): HTMLElement {
  return screen.getByRole("table")
}

function problem(type: string, status: number) {
  return HttpResponse.json(
    { type, title: type, status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

async function renderPage(route = "/exams/") {
  const view = renderAdmin(<ExamsPage />, { route })
  await within(await screen.findByRole("table")).findByText("Mechanics")
  return view
}

describe("confirm", () => {
  test("confirming a date patches its status to planned", async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole("button", { name: "Confirm Physics on 21 Oct 2026" }))

    const sent = await watcher.waitForMutation()
    expect(sent).toEqual({ method: "PATCH", id: assessmentIds.physicsEmis, body: { status: "planned" } })
  })

  test("the row becomes planned and the count to confirm goes down", async () => {
    const { user } = await renderPage()
    expect(await screen.findByRole("button", { name: /To confirm: 2/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Confirm Physics on 21 Oct 2026" }))

    await screen.findByRole("button", { name: /To confirm: 1/ })
    expect(screen.queryByRole("button", { name: "Confirm Physics on 21 Oct 2026" })).not.toBeInTheDocument()
    expect(within(table()).getAllByText("Not confirmed")).toHaveLength(1)
  })

  test("only a date that is not confirmed has a Confirm button", async () => {
    await renderPage()

    expect(screen.getAllByRole("button", { name: /^Confirm / })).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /^Confirm Mathematics/ })).not.toBeInTheDocument()
  })

  test("a refusal is reported with its translated message", async () => {
    const error = spyOn(toast, "error").mockImplementation(() => "")
    server.use(http.patch(apiUrl("/v1/admin/assessments/:id"), () => problem("common/forbidden", 403)))
    const { user } = await renderPage()
    try {
      await user.click(screen.getByRole("button", { name: "Confirm Physics on 21 Oct 2026" }))

      await waitUntil(() => error.mock.calls.length > 0, "no error shown")
      expect(error).toHaveBeenCalledWith("You do not have permission to do this.")
    } finally {
      error.mockRestore()
    }
  })
})

describe("dismiss and cancel", () => {
  test("dismissing a date asks first and patches the status to cancelled", async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole("button", { name: "Dismiss History on 18 Nov 2026" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Dismiss this date?")).toBeInTheDocument()
    expect(within(dialog).getByText(/History on 18 Nov 2026 for 2TN2/)).toBeInTheDocument()
    expect(watcher.mutations).toHaveLength(0)
    await user.click(within(dialog).getByRole("button", { name: "Dismiss" }))

    const sent = await watcher.waitForMutation()
    expect(sent).toEqual({ method: "PATCH", id: assessmentIds.historyHead, body: { status: "cancelled" } })
    await waitUntil(() => within(table()).queryByText("History") === null, "the dismissed date stays")
  })

  test("keeping the date sends nothing", async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole("button", { name: "Dismiss History on 18 Nov 2026" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Keep" }))

    await waitUntil(() => screen.queryByRole("alertdialog") === null, "the dialog stays")
    expect(watcher.mutations).toHaveLength(0)
  })

  test("a planned exam is cancelled with its own wording", async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole("button", { name: "Cancel Mathematics on 14 Oct 2026" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Cancel this exam?")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Cancel exam" }))

    const sent = await watcher.waitForMutation()
    expect(sent.body).toEqual({ status: "cancelled" })
    expect(sent.id).toBe(assessmentIds.mathMidterm)
  })

  test("a cancelled exam is listed without actions", async () => {
    const { user } = await renderPage()
    await user.click(screen.getByRole("button", { name: "Cancel Mathematics on 14 Oct 2026" }))
    await user.click(await within(await screen.findByRole("alertdialog")).findByRole("button", { name: "Cancel exam" }))
    await watcher.waitForMutation()

    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "cancelled")

    const row = await waitUntilRow("Algebra and functions")
    expect(within(row).getByText("Cancelled")).toBeInTheDocument()
    expect(within(row).queryAllByRole("button")).toHaveLength(0)
  })

  test("a refusal stays in the dialog", async () => {
    server.use(http.patch(apiUrl("/v1/admin/assessments/:id"), () => problem("common/forbidden", 403)))
    const { user } = await renderPage()

    await user.click(screen.getByRole("button", { name: "Dismiss History on 18 Nov 2026" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Dismiss" }))

    expect(await within(dialog).findByText("You do not have permission to do this.")).toBeInTheDocument()
  })
})

async function waitUntilRow(text: string): Promise<HTMLElement> {
  await within(table()).findByText(text)
  const row = within(table())
    .getAllByRole("row")
    .find((candidate) => within(candidate).queryByText(text))
  if (!row) throw new Error(`no row with ${text}`)
  return row
}

type User = Awaited<ReturnType<typeof renderPage>>["user"]

async function openEdit(user: User, label: string) {
  await user.click(screen.getByRole("button", { name: label }))
  return screen.findByRole("dialog")
}

async function openSetDate(user: User) {
  await user.click(screen.getByRole("switch", { name: "Show control weeks without a date" }))
  await user.click(await screen.findByRole("button", { name: "Set the date of English for 2TN2" }))
  return screen.findByRole("dialog")
}

async function openNew(user: User) {
  await user.click(screen.getByRole("button", { name: "New exam" }))
  return screen.findByRole("dialog")
}

async function fillRequired(user: User, dialog: HTMLElement) {
  await user.selectOptions(within(dialog).getByLabelText(/^Subject/), "Mathematics")
  await user.click(
    within(within(dialog).getByRole("group", { name: "2TN2" })).getByRole("checkbox", { name: "Whole group" }),
  )
  await pickDate(user, within(dialog).getByLabelText(/^Date/), "2026-10-21")
}

describe("edit", () => {
  test("the dialog starts with what is saved", async () => {
    const { user } = await renderPage()

    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    expect(within(dialog).getByRole("heading", { name: "Edit Mathematics" })).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^Date/)).toHaveTextContent("14 Oct 2026")
    expect(within(dialog).getByLabelText("Time")).toHaveValue("09:00")
    expect(within(dialog).getByLabelText("Room")).toHaveValue("204")
    expect(within(dialog).getByLabelText("Title")).toHaveValue("Algebra and functions")
    expect(within(dialog).getByLabelText("Control week")).toHaveValue("midterm_1")
  })

  test("only the changed field is sent", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    setValue(within(dialog).getByLabelText("Room"), "310")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    const sent = await watcher.waitForMutation()
    expect(sent).toEqual({ method: "PATCH", id: assessmentIds.mathMidterm, body: { room: "310" } })
    await waitUntil(() => screen.queryByRole("dialog") === null, "the dialog stays open")
  })

  test("an emptied room is cleared with null", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    setValue(within(dialog).getByLabelText("Room"), "")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect((await watcher.waitForMutation()).body).toEqual({ room: null })
  })

  test("a new date is sent alone", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    await pickDate(user, within(dialog).getByLabelText(/^Date/), "2026-10-15")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect((await watcher.waitForMutation()).body).toEqual({ date: "2026-10-15" })
  })

  test("nothing changed: nothing is sent", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitUntil(() => screen.queryByRole("dialog") === null, "the dialog stays open")
    expect(watcher.mutations).toHaveLength(0)
  })

  test("saving a date that is not confirmed, unchanged, confirms it", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Physics on 21 Oct 2026")

    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect(await watcher.waitForMutation()).toEqual({
      method: "PATCH",
      id: assessmentIds.physicsEmis,
      body: { status: "planned" },
    })
  })

  test("a change to a date that is not confirmed is sent as it is (the server confirms it)", async () => {
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Physics on 21 Oct 2026")

    setValue(within(dialog).getByLabelText("Room"), "101")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect((await watcher.waitForMutation()).body).toEqual({ room: "101" })
  })

  test("a refusal of the server is shown in the dialog, which stays open", async () => {
    server.use(http.patch(apiUrl("/v1/admin/assessments/:id"), () => problem("academic/assessment-exists", 409)))
    const { user } = await renderPage()
    const dialog = await openEdit(user, "Edit Mathematics on 14 Oct 2026")

    setValue(within(dialog).getByLabelText("Room"), "310")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect(
      await within(dialog).findByText("This group already has an exam of this subject, kind and date."),
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("set the date of a control week", () => {
  test("the subject, the group and the week are fixed", async () => {
    const { user } = await renderPage()

    const dialog = await openSetDate(user)

    expect(within(dialog).getByRole("heading", { name: "Set the date of English" })).toBeInTheDocument()
    expect(
      within(dialog).getByText("Midterm 1 for 2TN2."),
    ).toBeInTheDocument()
    expect(within(dialog).queryByLabelText(/^Subject/)).not.toBeInTheDocument()
    expect(within(dialog).queryByRole("checkbox")).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText("Control week")).toHaveValue("midterm_1")
    expect(within(dialog).getByText("Week: 12–17 Oct")).toBeInTheDocument()
  })

  test("creates the control with the row's subject, group, kind and week", async () => {
    const { user } = await renderPage()
    const dialog = await openSetDate(user)

    await pickDate(user, within(dialog).getByLabelText(/^Date/), "2026-10-14")
    await user.click(within(dialog).getByRole("button", { name: "Set date" }))

    expect(await watcher.waitForMutation()).toEqual({
      method: "POST",
      id: "",
      body: {
        subject_id: ids.english,
        audience: [{ group_id: ids.group2TN2, subgroup: null }],
        kind: "midterm",
        date: "2026-10-14",
        control: "midterm_1",
      },
    })
    await waitUntil(() => screen.queryByRole("dialog") === null, "the dialog stays open")
  })

  test("without a date nothing is sent and the dialog says what is missing", async () => {
    const { user } = await renderPage()
    const dialog = await openSetDate(user)

    await user.click(within(dialog).getByRole("button", { name: "Set date" }))

    expect(await within(dialog).findByText("Choose the date.")).toBeInTheDocument()
    expect(watcher.mutations).toHaveLength(0)
  })
})

describe("new exam", () => {
  test("sends the subject, groups, kind and date; empty fields are left out", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect(await watcher.waitForMutation()).toEqual({
      method: "POST",
      id: "",
      body: {
        subject_id: ids.math,
        audience: [{ group_id: ids.group2TN2, subgroup: null }],
        kind: "midterm",
        date: "2026-10-21",
      },
    })
    await waitUntil(() => screen.queryByRole("dialog") === null, "the dialog stays open")
  })

  test("sends the time in Tashkent as an instant, the room, the note and the kind", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.selectOptions(within(dialog).getByLabelText(/^Kind/), "final")
    setValue(within(dialog).getByLabelText("Time"), "10:30")
    setValue(within(dialog).getByLabelText("Room"), " Klaster ")
    setValue(within(dialog).getByLabelText("Note"), "Bring a pen.")
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect((await watcher.waitForMutation()).body).toEqual({
      subject_id: ids.math,
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
      kind: "final",
      date: "2026-10-21",
      starts_at: "2026-10-21T05:30:00.000Z",
      room: "Klaster",
      note: "Bring a pen.",
    })
  })

  test("choosing a control week sets its kind and sends the week", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.selectOptions(within(dialog).getByLabelText("Control week"), "final")
    expect(within(dialog).getByLabelText(/^Kind/)).toHaveValue("final")
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    const body = (await watcher.waitForMutation()).body
    expect(body).toMatchObject({ kind: "final", control: "final" })
  })

  test("a subgroup can be chosen instead of the whole group", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await user.selectOptions(within(dialog).getByLabelText(/^Subject/), "Physics")
    await user.click(
      within(within(dialog).getByRole("group", { name: "2TN2" })).getByRole("checkbox", { name: "Subgroup 2" }),
    )
    await pickDate(user, within(dialog).getByLabelText(/^Date/), "2026-10-22")
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect((await watcher.waitForMutation()).body).toMatchObject({
      subject_id: ids.physics,
      audience: [{ group_id: ids.group2TN2, subgroup: 2 }],
    })
  })

  test("an empty form is not sent and lists what is missing", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect(await within(dialog).findByText("Choose a subject.")).toBeInTheDocument()
    expect(within(dialog).getByText("Choose at least one group.")).toBeInTheDocument()
    expect(within(dialog).getByText("Choose the date.")).toBeInTheDocument()
    expect(watcher.mutations).toHaveLength(0)
  })

  test("a duplicate is refused with the server's translated message and the form stays", async () => {
    server.use(http.post(apiUrl("/v1/admin/assessments"), () => problem("academic/assessment-exists", 409)))
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect(
      await within(dialog).findByText("This group already has an exam of this subject, kind and date."),
    ).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^Subject/)).toHaveValue(ids.math)
  })

  test("an invalid exam is refused with a message that names what to check", async () => {
    server.use(http.post(apiUrl("/v1/admin/assessments"), () => problem("academic/invalid-assessment", 422)))
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect(await within(dialog).findByText(/^The exam is not valid/)).toBeInTheDocument()
  })

  test("a refusal for lack of rights is shown too", async () => {
    server.use(http.post(apiUrl("/v1/admin/assessments"), () => problem("common/forbidden", 403)))
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    expect(await within(dialog).findByText("You do not have permission to do this.")).toBeInTheDocument()
  })

  test("the new exam appears in the list", async () => {
    const { user } = await renderPage()
    const dialog = await openNew(user)

    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole("button", { name: "Add exam" }))

    // Mathematics already had a midterm and a final.
    await waitUntil(() => within(table()).queryAllByText("Mathematics").length === 3, "the new exam is not listed")
  })
})

describe("export", () => {
  test("downloads the rows of the current filters as CSV in the language of the page", async () => {
    let blob: Blob | null = null
    const originalCreate = URL.createObjectURL
    URL.createObjectURL = (value) => {
      blob = value as Blob
      return "blob:test"
    }
    URL.revokeObjectURL = () => undefined
    try {
      const { user } = await renderPage()

      await user.click(screen.getByRole("button", { name: "Export CSV" }))

      await waitUntil(() => blob !== null, "no file")
      const text = await (blob as unknown as Blob).text()
      const lines = text.replace(/^﻿/, "").split("\r\n")
      expect(lines[0]).toBe("Date,Control week,Subject,Groups,Kind,Control,Time,Room,Status,Source,Set by,Title,Note")
      expect(lines).toContain(
        '2026-10-14,,Mathematics,2TN2,Midterm (PC),Midterm 1,09:00,204,Planned,Teacher,Rakhimov Timur,Algebra and functions,"Chapters 1–4; bring a calculator."',
      )
      // The header and the five dated controls that are not cancelled.
      expect(lines).toHaveLength(6)
    } finally {
      URL.createObjectURL = originalCreate
    }
  })

  test("a week without a date is exported as its first and last day", async () => {
    let blob: Blob | null = null
    const originalCreate = URL.createObjectURL
    URL.createObjectURL = (value) => {
      blob = value as Blob
      return "blob:test"
    }
    URL.revokeObjectURL = () => undefined
    try {
      const { user } = await renderPage("/exams/?undated=true")
      await within(table()).findByText("English")

      await user.click(screen.getByRole("button", { name: "Export CSV" }))

      await waitUntil(() => blob !== null, "no file")
      const text = await (blob as unknown as Blob).text()
      expect(text).toContain(",2026-10-12 – 2026-10-17,English,2TN2,Midterm (PC),Midterm 1,,,Date not set,Administration,")
    } finally {
      URL.createObjectURL = originalCreate
    }
  })
})
