import { describe, expect, it } from "bun:test"
import { countActiveFilters, toItemsParams, type BrowseState } from "./use-browse-state"

const empty = {
  q: "",
  source: "all",
  subject: null,
  topic: null,
  tag: null,
  year: null,
  type: null,
  lang: null,
  uploader: null,
  hasText: false,
  shelf: null,
  sort: null,
  collection: null,
} as unknown as BrowseState

describe("the tag filter", () => {
  it("is sent as the tag parameter and counts as one active filter", () => {
    const state = { ...empty, tag: "poetry" } as BrowseState

    expect(toItemsParams(state).tag).toBe("poetry")
    expect(countActiveFilters(state)).toBe(1)
  })

  it("is left out of the request when no tag is chosen", () => {
    expect(toItemsParams(empty).tag).toBeUndefined()
    expect(countActiveFilters(empty)).toBe(0)
  })
})
