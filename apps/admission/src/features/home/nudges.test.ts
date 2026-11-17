import { describe, expect, test } from "bun:test"
import type { ListEntry } from "../chooser/types"
import type { CalendarEntry } from "../deadlines/calendar-api"
import { buildNudges } from "./nudges"

const entry = (id: string, status: string) =>
  ({ id, status, institution: { id: `i-${id}`, name: id } }) as unknown as ListEntry
const cal = (id: string, day: string): CalendarEntry => ({
  key: `uni:${id}:rd:${day}`,
  source: "university",
  title: id,
  day,
  due_utc: day,
  predicted: false,
  url_path: null,
})

describe("buildNudges", () => {
  test("tiers planned deadlines and ignores far ones", () => {
    const nudges = buildNudges(
      [entry("a", "applying"), entry("b", "considering"), entry("c", "applying"), entry("d", "considering")],
      [cal("a", "2026-03-01"), cal("b", "2026-03-05"), cal("c", "2026-03-25"), cal("d", "2026-05-01")],
      new Set(),
      "2026-03-01",
    )
    expect(nudges.map((nudge) => [nudge.entry.id, nudge.tier])).toEqual([
      ["a", "today"],
      ["b", "week"],
      ["c", "month"],
    ])
  })

  test("asks for the result after the deadline unless reported", () => {
    const entries = [entry("a", "applied"), entry("b", "applied")]
    const items = [cal("a", "2026-02-01"), cal("b", "2026-02-01")]
    const nudges = buildNudges(entries, items, new Set(["i-b"]), "2026-03-01")
    expect(nudges.map((nudge) => [nudge.kind, nudge.entry.id])).toEqual([["add-result", "a"]])
  })
})
