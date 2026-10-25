import { describe, expect, it } from "bun:test"
import { libCards, libListPhysics } from "@ihsp/test-utils"
import {
  emptySettings,
  entryFromServer,
  entryProblems,
  hasItem,
  isHttpUrl,
  itemEntry,
  linkEntry,
  moveVisible,
  removeEntry,
  settingsFromServer,
  settingsProblems,
  toItemInputs,
  toListInput,
  updateEntry,
} from "./entries"

const loaded = libListPhysics.entries.map(entryFromServer)

describe("entries from the server and back", () => {
  it("round-trips a loaded list, keeping items, the link, topics and the optional fields", () => {
    const inputs = toItemInputs(loaded)

    expect(inputs).toHaveLength(5)
    expect(inputs[0]).toEqual({
      item_id: libListPhysics.entries[0]!.item!.id!,
      importance: "essential",
      page_from: 5,
      page_to: 30,
      week_label: "Week 1",
      due_on: "2026-10-14",
      topic_id: libListPhysics.entries[0]!.topic_id,
      note: "Read before the lab.",
    })
    expect(inputs[3]).toEqual({
      url: "https://example.org/kinematics-video",
      title: "Kinematics: worked examples (video)",
      importance: "further",
      page_from: null,
      page_to: null,
      week_label: null,
      due_on: null,
      topic_id: null,
      note: "A plain link, not a library item.",
    })
  })

  it("makes a new item entry Recommended and a new link entry with a trimmed address", () => {
    const entry = itemEntry(libCards.bookPhysics10)
    const link = linkEntry("  Video ", " https://example.org/a ")

    expect(entry.importance).toBe("recommended")
    expect(toItemInputs([entry])[0]).toMatchObject({ item_id: libCards.bookPhysics10.id, importance: "recommended" })
    expect(toItemInputs([link])[0]).toMatchObject({ url: "https://example.org/a", title: "Video" })
  })

  it("finds an item that is already in the list", () => {
    expect(hasItem(loaded, libListPhysics.entries[0]!.item!.id!)).toBe(true)
    expect(hasItem(loaded, "nope")).toBe(false)
  })

  it("updates and removes one entry by key", () => {
    const key = loaded[1]!.key

    const updated = updateEntry(loaded, key, { importance: "further", note: "  hi " })
    expect(updated[1]).toMatchObject({ importance: "further", note: "  hi " })
    expect(toItemInputs(updated)[1]?.note).toBe("hi")
    expect(removeEntry(loaded, key)).toHaveLength(4)
  })
})

describe("entryProblems", () => {
  it("accepts a catalogue entry and checks a link for a title and an http(s) address", () => {
    expect(entryProblems(loaded[0]!)).toEqual([])
    expect(entryProblems(linkEntry("", "https://example.org"))).toEqual(["titleRequired"])
    expect(entryProblems(linkEntry("x", "ftp://example.org"))).toEqual(["urlInvalid"])
    expect(entryProblems(linkEntry("x", "not a url"))).toEqual(["urlInvalid"])
    expect(isHttpUrl("http://example.org/a")).toBe(true)
  })

  it("wants whole page numbers with the first page not after the last", () => {
    const entry = itemEntry(libCards.bookPhysics10)

    expect(entryProblems({ ...entry, pageFrom: "5", pageTo: "30" })).toEqual([])
    expect(entryProblems({ ...entry, pageFrom: "30", pageTo: "5" })).toEqual(["pagesInvalid"])
    expect(entryProblems({ ...entry, pageFrom: "1.5" })).toEqual(["pagesInvalid"])
    expect(entryProblems({ ...entry, pageFrom: "0" })).toEqual(["pagesInvalid"])
    expect(entryProblems({ ...entry, pageFrom: "7", pageTo: "" })).toEqual([])
  })
})

const names = (list: typeof loaded) => list.map((entry) => entry.item?.title ?? entry.title)

describe("moveVisible", () => {
  it("moves an entry by its shown place", () => {
    const moved = moveVisible(loaded, () => true, 0, 2)

    expect(names(moved)).toEqual([...names(loaded).slice(1, 3), names(loaded)[0]!, ...names(loaded).slice(3)])
  })

  it("keeps hidden entries in the list while the shown ones change places, so saving does not lose them", () => {
    // The second entry is hidden (a UniLibrary record while UniLibrary is off).
    const hidden = loaded[1]!.key
    const visible = (entry: (typeof loaded)[number]) => entry.key !== hidden

    const moved = moveVisible(loaded, visible, 0, 1)

    expect(moved).toHaveLength(5)
    expect(moved.some((entry) => entry.key === hidden)).toBe(true)
    expect(moved.filter(visible).map((entry) => entry.key)).toEqual([2, 0, 3, 4].map((index) => loaded[index]!.key))
  })

  it("ignores places that do not exist", () => {
    expect(moveVisible(loaded, () => true, 0, 9).map((e) => e.key)).toEqual(loaded.map((e) => e.key))
  })
})

describe("list settings", () => {
  it("needs a title, and a subject for a list of a subject", () => {
    expect(settingsProblems(emptySettings())).toEqual(["titleRequired", "subjectRequired"])
    expect(settingsProblems({ ...emptySettings(), title: "T", subjectId: "s" })).toEqual([])
  })

  it("needs at least one group for a list of groups, unless groups cannot be listed", () => {
    const groups = { ...emptySettings(), title: "T", scope: "groups" as const }

    expect(settingsProblems(groups)).toEqual(["groupsRequired"])
    expect(settingsProblems(groups, false)).toEqual([])
    expect(settingsProblems({ ...groups, groupIds: ["g"] })).toEqual([])
    expect(settingsProblems({ ...emptySettings(), title: "T", scope: "school" })).toEqual([])
  })

  it("builds the body of the list and sends groups only for a list of groups", () => {
    const body = toListInput({
      ...settingsFromServer(libListPhysics),
      title: "  Physics ",
    })

    expect(body).toMatchObject({
      title: "Physics",
      scope: "subject",
      subject_id: libListPhysics.subject!.id,
      group_ids: [],
      year_of_study: 1,
      term_half: 1,
      status: "published",
    })
    expect(toListInput({ ...emptySettings(), title: "T", scope: "groups", groupIds: ["g1"] }).group_ids).toEqual(["g1"])
    expect(toListInput({ ...emptySettings(), title: "T" }).subject_id).toBeNull()
  })
})
