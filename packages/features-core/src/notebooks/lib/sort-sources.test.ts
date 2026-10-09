import { describe, expect, test } from "bun:test"
import { sourceFailed, sourceFile, sourceLesson, sourceStale, sourceText } from "@ihsp/test-utils"
import { canShowFlat, groupSources, hasPendingSources, selectionState } from "./sort-sources"

describe("groupSources", () => {
  test("orders groups by kind and drops empty ones", () => {
    const groups = groupSources([sourceText, sourceLesson, sourceFile, sourceStale])

    expect(groups.map((group) => group.kind)).toEqual(["file", "chat", "lesson_resource", "text"])
  })

  test("keeps the position order inside a group", () => {
    const second = { ...sourceFile, id: "f2", position: 9 }
    const first = { ...sourceFile, id: "f1", position: 2 }

    expect(groupSources([second, first])[0]?.sources.map((source) => source.id)).toEqual(["f1", "f2"])
  })
})

describe("selectionState", () => {
  test("is all, some or none of the usable sources", () => {
    expect(selectionState([sourceFile, sourceLesson])).toBe("all")
    expect(selectionState([sourceFile, { ...sourceLesson, selected: false }])).toBe("some")
    expect(selectionState([{ ...sourceFile, selected: false }])).toBe("none")
  })

  test("ignores sources that cannot be used (failed, processing)", () => {
    expect(selectionState([sourceFile, { ...sourceFailed, selected: true }])).toBe("all")
    expect(selectionState([sourceFailed])).toBe("none")
  })
})

describe("canShowFlat and hasPendingSources", () => {
  test("flat only for one kind and fewer than five sources", () => {
    expect(canShowFlat([sourceFile])).toBe(true)
    expect(canShowFlat([sourceFile, sourceText])).toBe(false)
    expect(canShowFlat(Array.from({ length: 5 }, (_, i) => ({ ...sourceFile, id: String(i) })))).toBe(false)
  })

  test("pending means pending or processing", () => {
    expect(hasPendingSources([sourceFile])).toBe(false)
    expect(hasPendingSources([sourceFile, { ...sourceFile, status: "processing" }])).toBe(true)
    expect(hasPendingSources(undefined)).toBe(false)
  })
})
