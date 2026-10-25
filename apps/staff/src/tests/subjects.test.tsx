/** The teacher's Subject page: groups and subgroups, and the three tiers of materials. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { ids, setDropdownValue } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { configureTests, freezeTime, messages, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const notebookTexts = JSON.parse(
  readFileSync(join(import.meta.dir, "../../../sp/messages/en/notebooks.json"), "utf8"),
) as Messages
const withNotebooks = mergeMessages(messages.en as Messages, notebookTexts)

describe("subjects", () => {
  test("lists the subjects the teacher teaches", async () => {
    renderStaff(<SubjectsPage />, { messages: withNotebooks })
    expect(await screen.findByRole("link", { name: /Mathematics/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: /English/ })).toBeTruthy()
  })

  test("the subject page shows the three tiers and adds a link for one group", async () => {
    renderStaff(<SubjectPage />, { messages: withNotebooks, route: `/subjects/view/?id=${ids.math}` })
    expect(await screen.findByRole("heading", { name: "Administration materials" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "My materials for this subject" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Materials for one group" })).toBeTruthy()
    // the administration tier is read-only: no remove button
    expect(await screen.findByText("Algebra reference tables")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Remove Algebra reference tables" })).toBeNull()
    expect(screen.getByRole("button", { name: "Remove My Mathematics cheat sheet" })).toBeTruthy()

    const group = screen.getByRole("group", { name: "2TN2" })
    fireEvent.click(within(group).getByRole("button", { name: "Link" }))
    setDropdownValue(within(group).getByLabelText("Web address"), "https://example.org/x")
    setDropdownValue(within(group).getByLabelText("Title"), "Extra for 2TN2")
    fireEvent.click(within(group).getByRole("button", { name: "Add material" }))
    await waitFor(() =>
      expect(within(screen.getByRole("group", { name: "2TN2" })).getByText("Extra for 2TN2")).toBeTruthy(),
    )
  })

  test("a divided subject has a block per subgroup", async () => {
    renderStaff(<SubjectPage />, { messages: withNotebooks, route: `/subjects/view/?id=${ids.english}` })
    expect(await screen.findByRole("group", { name: "2TN2 · subgroup 1" })).toBeTruthy()
    expect(screen.getByRole("group", { name: "2TN2 · subgroup 2" })).toBeTruthy()
  })
})
