/** ACA-8: the live conflict check behind the timetable entry editor, and the editor in edit mode. */
import { describe, expect, mock, test } from "bun:test"
import { apiUrl, currentTerm, ids, server, timetableEntries } from "@ihsp/test-utils"
import type { TimetableEntryInput } from "@ihsp/api"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EntryEditorDialog } from "../features/timetable/components/entry-editor-dialog"
import { useConflictCheck } from "../features/timetable/hooks/use-conflict-check"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

const clashing: TimetableEntryInput = {
  term_id: currentTerm.id,
  weekday: 1,
  period: 1,
  week_parity: "every",
  subject_id: ids.math,
  teacher_id: ids.teacherRakhimov,
  room_name: null,
  audience: [{ group_id: ids.group2TN2, subgroup: null }],
  valid_from: "2026-09-02",
  valid_to: null,
}

function Probe({ input, ownId }: { input: TimetableEntryInput | null; ownId?: string }) {
  const check = useConflictCheck(input, ownId)
  return (
    <output data-testid="check">
      {JSON.stringify({
        conflicts: check.conflicts.length,
        pending: check.pending,
        failed: check.failed,
        checked: check.checked,
      })}
    </output>
  )
}

function state(): { conflicts: number; pending: boolean; failed: boolean; checked: boolean } {
  return JSON.parse(screen.getByTestId("check").textContent ?? "{}")
}

describe("useConflictCheck", () => {
  test("an incomplete entry is not sent and never reports pending", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl("/v1/admin/timetable/check"), () => {
        calls += 1
        return HttpResponse.json({ conflicts: [] })
      }),
    )
    renderAdmin(<Probe input={null} />, { route: "/timetable/" })

    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(calls).toBe(0)
    expect(state()).toEqual({ conflicts: 0, pending: false, failed: false, checked: false })
  })

  test("is pending until the answer is in, then lists the conflicts", async () => {
    renderAdmin(<Probe input={clashing} />, { route: "/timetable/" })
    expect(state().pending).toBe(true)

    await waitUntil(() => state().checked, "check never finished")
    expect(state()).toEqual({ conflicts: 1, pending: false, failed: false, checked: true })
  })

  test("the entry's own previous version is not a conflict", async () => {
    renderAdmin(<Probe input={clashing} ownId={timetableEntries[0]?.id} />, { route: "/timetable/" })

    await waitUntil(() => state().checked, "check never finished")
    expect(state().conflicts).toBe(0)
  })

  test("a failing check is reported as failed, not as a conflict", async () => {
    server.use(http.post(apiUrl("/v1/admin/timetable/check"), () => new HttpResponse(null, { status: 500 })))
    renderAdmin(<Probe input={clashing} />, { route: "/timetable/" })

    await waitUntil(() => state().failed, "failure not reported")
    expect(state()).toEqual({ conflicts: 0, pending: false, failed: true, checked: false })
  })

  test("a change in the entry is checked again", async () => {
    const teachers: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/admin/timetable/check"), async ({ request }) => {
        const body = (await request.json()) as TimetableEntryInput
        teachers.push(body.teacher_id)
        return HttpResponse.json({ conflicts: [] })
      }),
    )
    const { rerender } = renderAdmin(<Probe input={clashing} />, { route: "/timetable/" })
    await waitUntil(() => state().checked, "first check never finished")

    rerender(<Probe input={{ ...clashing, teacher_id: ids.teacherSmirnova }} />)

    await waitUntil(() => teachers.length === 2, "no second check")
    expect(teachers).toEqual([ids.teacherRakhimov, ids.teacherSmirnova])
  })
})

describe("timetable entry editor, editing", () => {
  const entry = timetableEntries[0]
  if (!entry) throw new Error("fixture has no timetable entry")

  test("an existing entry is patched without its term, and its own clash does not block saving", async () => {
    let patched: Record<string, unknown> | null = null
    server.use(
      http.patch(apiUrl("/v1/admin/timetable/:id"), async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(entry)
      }),
    )
    const onClose = mock(() => undefined)
    const { user } = renderAdmin(
      <EntryEditorDialog term={currentTerm} entry={entry} defaults={null} open onClose={onClose} />,
      { route: "/timetable/" },
    )
    expect(await screen.findByText("Edit entry")).toBeInTheDocument()
    await screen.findByText("No conflicts.")

    const save = screen.getByRole("button", { name: "Save entry" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")
    await user.click(save)

    await waitUntil(() => patched !== null, "no patch")
    expect(patched).toMatchObject({ weekday: entry.weekday, period: entry.period, subject_id: entry.subject.id })
    expect(patched).not.toHaveProperty("term_id")
    await waitUntil(() => onClose.mock.calls.length > 0, "not closed")
  })

  test("deleting asks first and then removes the entry", async () => {
    let deleted = false
    server.use(
      http.delete(apiUrl("/v1/admin/timetable/:id"), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onClose = mock(() => undefined)
    const { user } = renderAdmin(
      <EntryEditorDialog term={currentTerm} entry={entry} defaults={null} open onClose={onClose} />,
      { route: "/timetable/" },
    )

    await user.click(await screen.findByRole("button", { name: "Delete entry" }))
    const confirm = await screen.findByRole("alertdialog")
    expect(deleted).toBe(false)
    await user.click(
      Array.from(confirm.querySelectorAll("button")).find((button) => button.textContent === "Delete entry") as HTMLElement,
    )

    await waitUntil(() => deleted, "no delete request")
    await waitUntil(() => onClose.mock.calls.length > 0, "not closed")
  })

  test("a failed conflict check is shown and does not block saving", async () => {
    server.use(http.post(apiUrl("/v1/admin/timetable/check"), () => new HttpResponse(null, { status: 500 })))
    renderAdmin(<EntryEditorDialog term={currentTerm} entry={entry} defaults={null} open onClose={() => undefined} />, {
      route: "/timetable/",
    })

    expect(await screen.findByText("Conflict check failed. The server checks again on save.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save entry" })).toBeEnabled()
  })
})
