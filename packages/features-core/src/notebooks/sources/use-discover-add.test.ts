import { describe, expect, it } from "bun:test"
import type { DiscoverResult } from "@ihsp/api"
import { sourceFor } from "./use-discover-add"

const base: DiscoverResult = {
  title: "Biology 9",
  url: "/library/biology-9",
  site: "IHSP",
  snippet: "Photosynthesis uses light.",
  why: "",
  already_added: false,
}

describe("sourceFor", () => {
  it("adds a library hit by reference, not as a URL", () => {
    expect(sourceFor({ ...base, origin: "db", ref_kind: "library_item", ref_id: "abc" })).toEqual({
      kind: "library_item",
      item_id: "abc",
    })
  })

  it("copies a notebook passage as text", () => {
    expect(sourceFor({ ...base, origin: "db", ref_kind: "notebook_source", ref_id: "s1" })).toEqual({
      kind: "text",
      title: "Biology 9",
      text: "Photosynthesis uses light.",
    })
  })

  it("keeps web pages as URL sources", () => {
    expect(sourceFor({ ...base, url: "https://example.org/a" })).toEqual({
      kind: "url",
      url: "https://example.org/a",
      title: "Biology 9",
    })
  })
})
