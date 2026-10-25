/**
 * UF-ADM-06: Administration adds a timetable entry. The editor checks conflicts while the form is edited and refuses
 * to save a conflicting entry; moving it to a free slot clears the conflict and the entry is created.
 */

import type { GroupItem, Term, TimetableEntry } from "@ihsp/api"
import { ADMIN } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

test("UF-ADM-06 a conflicting timetable entry cannot be saved, a free slot can", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, ADMIN, "admin", { path: "/timetable/" })

  // Data from the API: the current term, group 2TN2, its entries and a free slot.
  const terms = await api<Term[]>(page, "GET", "/v1/admin/terms")
  const term = terms.find((item) => item.is_current) ?? terms[0]
  const groups = await api<GroupItem[]>(page, "GET", "/v1/admin/groups")
  const group = groups.find((item) => item.name === "2TN2")
  test.skip(!term || !group, "the demo term or group 2TN2 is missing (run seed-demo)")
  if (!term || !group) return
  const entries = await api<TimetableEntry[]>(
    page,
    "GET",
    `/v1/admin/timetable?term_id=${term.id}&group_id=${group.id}`,
  )
  const busy = entries[0]
  test.skip(!busy, "group 2TN2 has no timetable entries")
  if (!busy) return
  const periods = [...new Set(term.bells.map((bell) => bell.period))]
  const free = [1, 2, 3, 4, 5, 6]
    .flatMap((weekday) => periods.map((period) => ({ weekday, period })))
    .find(
      (slot) =>
        term.bells.some((bell) => bell.period === slot.period && bell.weekdays.includes(slot.weekday)) &&
        !entries.some((entry) => entry.weekday === slot.weekday && entry.period === slot.period),
    )
  test.skip(!free, "the timetable of 2TN2 has no free slot")
  if (!free) return

  await page.goto(`${URLS.admin}/timetable/?term=${term.id}&view=group&entity=${group.id}`)
  await expect(heading(page, "Timetable", 1)).toBeVisible()
  await expect(page.getByLabel("Group", { exact: true })).toHaveValue(group.id)
  await a11y(page, testInfo, { label: "admin timetable" })

  // 1. A second lesson for 2TN2 in an occupied slot: the audience is busy, saving is off.
  await page.getByRole("button", { name: `Add an entry on ${WEEKDAYS[busy.weekday]}, period ${busy.period}` }).click()
  const dialog = page.getByRole("dialog", { name: "New entry" })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Subject").selectOption({ index: 1 })
  await expect(dialog.getByText(/^Conflicts: \d+/)).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText("Audience", { exact: true }).first()).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Save entry" })).toBeDisabled()
  await a11y(page, testInfo, { label: "admin timetable conflict" })

  // 2. Move it to a free slot: no conflicts, Save is on, the entry is created.
  await dialog.getByLabel("Weekday").selectOption(String(free.weekday))
  await dialog.getByLabel("Period", { exact: true }).selectOption(String(free.period))
  await expect(dialog.getByText("No conflicts.")).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByRole("button", { name: "Save entry" })).toBeEnabled()
  await dialog.getByRole("button", { name: "Save entry" }).click()
  await expect(toast(page, "Entry created")).toBeVisible()
  await expect(dialog).toBeHidden()

  // 3. The new entry is in the grid; delete it again through the editor.
  const created = (
    await api<TimetableEntry[]>(page, "GET", `/v1/admin/timetable?term_id=${term.id}&group_id=${group.id}`)
  ).find((entry) => !entries.some((old) => old.id === entry.id))
  expect(created, "the entry was created on the server").toBeTruthy()
  try {
    await page
      .getByRole("button", { name: /^Edit entry / })
      .filter({ hasText: created?.subject.name ?? "" })
      .last()
      .click()
    const editor = page.getByRole("dialog", { name: "Edit entry" })
    await expect(editor).toBeVisible()
    await editor.getByRole("button", { name: "Delete entry" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete entry" }).click()
    await expect(toast(page, "Entry deleted")).toBeVisible()
  } finally {
    if (created) await api(page, "DELETE", `/v1/admin/timetable/${created.id}`).catch(() => undefined)
  }
})

test("UF-ADM-06 a new room name typed in the editor is allowed (it creates the room)", async ({ page }) => {
  test.slow()
  await loginAs(page, ADMIN, "admin", { path: "/timetable/" })
  const terms = await api<Term[]>(page, "GET", "/v1/admin/terms")
  const term = terms.find((item) => item.is_current) ?? terms[0]
  const groups = await api<GroupItem[]>(page, "GET", "/v1/admin/groups")
  const group = groups.find((item) => item.name === "1TN1")
  test.skip(!term || !group, "the demo term or group 1TN1 is missing")
  if (!term || !group) return
  const entries = await api<TimetableEntry[]>(
    page,
    "GET",
    `/v1/admin/timetable?term_id=${term.id}&group_id=${group.id}`,
  )
  const slot = [1, 2, 3, 4, 5, 6]
    .flatMap((weekday) => [1, 2, 3, 4, 5, 6].map((period) => ({ weekday, period })))
    .find(
      (candidate) =>
        term.bells.some((bell) => bell.period === candidate.period && bell.weekdays.includes(candidate.weekday)) &&
        !entries.some((entry) => entry.weekday === candidate.weekday && entry.period === candidate.period),
    )
  test.skip(!slot, "no free slot for 1TN1")
  if (!slot) return
  await page.goto(`${URLS.admin}/timetable/?term=${term.id}&view=group&entity=${group.id}`)
  await page.getByRole("button", { name: `Add an entry on ${WEEKDAYS[slot.weekday]}, period ${slot.period}` }).click()
  const dialog = page.getByRole("dialog", { name: "New entry" })
  await dialog.getByLabel("Subject").selectOption({ index: 1 })
  await dialog.getByLabel("Room").fill(`E2E-${Date.now() % 10_000}`)
  await expect(dialog.getByText("No conflicts.")).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByRole("button", { name: "Save entry" })).toBeEnabled()
  await dialog.getByRole("button", { name: "Cancel" }).click()
})
