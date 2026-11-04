import { describe, expect, it } from "bun:test"
import { chatLibrary, studioLibrary } from "./library"
import { isRenderable } from "./renderable"
import corpus from "./corpus.json"
import { splitOpenUi } from "./split"

// The same corpus the backend validates (app/shared/openui/corpus.json, byte-identical copy).
const libraries = { chat: chatLibrary, studio: studioLibrary } as const

describe("OPENUI-5 shared corpus: renderability", () => {
  for (const block of corpus.blocks) {
    it(`${block.subset} ${block.name} is ${block.valid ? "renderable" : "not renderable"}`, () => {
      expect(isRenderable(block.source, libraries[block.subset as keyof typeof libraries])).toBe(block.valid)
    })
  }
})

describe("OPENUI-5 shared corpus: fences", () => {
  for (const fence of corpus.fences) {
    it(`${fence.name} splits as labelled`, () => {
      const segments = splitOpenUi(fence.text)
      expect(segments.filter((s) => s.kind === "block")).toHaveLength(fence.blocks)
      expect(segments.filter((s) => s.kind === "pending")).toHaveLength(fence.pending)
    })
  }
})
