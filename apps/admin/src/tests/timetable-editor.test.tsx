/** ADM-9, ACA-5–ACA-8, UF-ADM-06: the entry editor checks conflicts live and blocks saving on conflicts. */
import { describe, expect, mock, test } from "bun:test"
import { apiUrl, currentTerm, ids, selectDropdownValue, server, timetableEntries } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EntryEditorDialog, type EntryDefaults } from "../features/timetable/components/entry-editor-dialog"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const defaults: EntryDefaults = {
  weekday: 1,
  period: 1,
  teacher_id: ids.teacherRakhimov,
  audience: [{ group_id: ids.group2TN2, subgroup: null }],
}

function renderEditor(onClose = mock(() => undefined)) {
  const view = renderAdmin(
    <EntryEditorDialog term={currentTerm} entry={null} defaults={defaults} open onClose={onClose} />,
    {
      route: "/timetable/",
    },
  )
  return { ...view, onClose }
}

async function chooseSubject(user: ReturnType<typeof renderEditor>["user"]) {
  await selectDropdownValue(user, screen.getByLabelText(/^Subject/), ids.math)
}

describe("timetable entry editor", () => {
  test("a conflict from the live check is shown and blocks saving", async () => {
    let saved = false
    server.use(
      http.post(apiUrl("/v1/admin/timetable"), () => {
        saved = true
        return HttpResponse.json(timetableEntries[0])
      }),
    )
    const { user } = renderEditor()
    await chooseSubject(user)

    const conflicts = await screen.findByTestId("conflicts")
    expect(within(conflicts).getByText("Rakhimov T. already teaches 2TN2 in period 1 on Monday")).toBeInTheDocument()
    const save = screen.getByRole("button", { name: "Save entry" })
    expect(save).toBeDisabled()

    await user.click(save)
    expect(saved).toBe(false)
  })

  test("another teacher clears the conflict and a new room name is saved as typed", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/admin/timetable"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(timetableEntries[0])
      }),
    )
    const { user, onClose } = renderEditor()
    await chooseSubject(user)
    await screen.findByTestId("conflicts")

    await selectDropdownValue(user, screen.getByLabelText(/^Teacher/), ids.teacherSmirnova)
    await waitUntil(() => screen.queryByTestId("conflicts") === null, "conflicts still shown")
    expect(await screen.findByText("No conflicts.")).toBeInTheDocument()

    setValue(screen.getByLabelText(/^Room/), "Lab 7")
    const save = screen.getByRole("button", { name: "Save entry" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")
    await user.click(save)

    await waitUntil(() => body !== null, "no request")
    expect(body).toMatchObject({
      term_id: currentTerm.id,
      weekday: 1,
      period: 1,
      subject_id: ids.math,
      teacher_id: ids.teacherSmirnova,
      room_name: "Lab 7",
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
    })
    await waitUntil(() => onClose.mock.calls.length > 0, "not closed")
  })

  test("a conflict returned by the server on save (409) is listed", async () => {
    server.use(
      http.post(apiUrl("/v1/admin/timetable/check"), () => HttpResponse.json({ conflicts: [] })),
      http.post(apiUrl("/v1/admin/timetable"), () =>
        HttpResponse.json(
          {
            type: "common/conflict",
            title: "Conflict",
            status: 409,
            params: {
              conflicts: [{ kind: "room", with_entry_id: null, with_lesson_id: null, description: "Room 102 is busy" }],
            },
          },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderEditor()
    await chooseSubject(user)
    const save = screen.getByRole("button", { name: "Save entry" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")

    await user.click(save)

    expect(await screen.findByText("Room 102 is busy")).toBeInTheDocument()
  })

  test("a divisible subject suggests two subgroup entries", async () => {
    const { user } = renderEditor()
    await selectDropdownValue(user, screen.getByLabelText(/^Subject/), ids.english)

    await user.click(await screen.findByRole("button", { name: "Split into subgroups" }))

    const group = screen.getByRole("group", { name: "2TN2" })
    expect(within(group).getByRole("checkbox", { name: "Subgroup 1" })).toBeChecked()
    expect(within(group).getByRole("checkbox", { name: "Whole group" })).not.toBeChecked()
  })
})
