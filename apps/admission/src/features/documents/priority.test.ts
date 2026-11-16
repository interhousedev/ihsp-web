import { describe, expect, test } from "bun:test"
import type { ChecklistItem } from "./api"
import { groupChecklist, sortChecklist } from "./priority"

function item(id: string, over: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id,
    template_key: "entry.essay",
    title_key: "essay",
    list_entry_id: null,
    owner: "student",
    status: "todo",
    due_utc: null,
    document_id: null,
    source_url: null,
    important: false,
    urgent_override: null,
    app_path: null,
    urgent: false,
    quadrant: "drop",
    ...over,
  }
}

const ids = (xs: ChecklistItem[]) => xs.map((x) => x.id)

describe("sortChecklist", () => {
  const items = [
    item("plain"),
    item("late", { due_utc: "2026-12-01T00:00:00Z" }),
    item("soon", { due_utc: "2026-11-18T00:00:00Z", urgent: true }),
    item("imp", { important: true }),
    item("done", { status: "done", due_utc: "2026-11-01T00:00:00Z", urgent: true, important: true }),
  ]

  test("urgency: urgent first, then nearest deadline; finished last", () => {
    expect(ids(sortChecklist(items, "urgency"))).toEqual(["soon", "late", "imp", "plain", "done"])
  })
  test("importance: important first", () => {
    expect(ids(sortChecklist(items, "importance"))[0]).toBe("imp")
  })
  test("deadline: ascending, undated after dated", () => {
    expect(ids(sortChecklist(items, "deadline"))).toEqual(["soon", "late", "imp", "plain", "done"])
  })
  test("status: in progress, to do, then done", () => {
    const mixed = [item("d", { status: "done" }), item("t"), item("p", { status: "in_progress" })]
    expect(ids(sortChecklist(mixed, "status"))).toEqual(["p", "t", "d"])
  })
  test("does not mutate the input", () => {
    const copy = [...items]
    sortChecklist(items, "deadline")
    expect(items).toEqual(copy)
  })
})

describe("groupChecklist", () => {
  test("splits by server quadrant, keeps empty groups, sorts within", () => {
    const g = groupChecklist([
      item("a", { quadrant: "do", urgent: true, important: true, due_utc: "2026-11-20T00:00:00Z" }),
      item("b", { quadrant: "do", urgent: true, important: true, due_utc: "2026-11-17T00:00:00Z" }),
      item("c", { quadrant: "schedule", important: true }),
      item("d"),
    ])
    expect(ids(g.do)).toEqual(["b", "a"])
    expect(ids(g.schedule)).toEqual(["c"])
    expect(g.delegate).toEqual([])
    expect(ids(g.drop)).toEqual(["d"])
  })
})
