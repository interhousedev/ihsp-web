import { describe, expect, it } from "bun:test"
import catalog from "./catalog.json"
import { chatLibrary, studioLibrary } from "./library"

describe("OPENUI-3 libraries follow the catalog", () => {
  it("has every catalog component, with zod keys in the catalog prop order", () => {
    expect(Object.keys(chatLibrary.components).toSorted()).toEqual(catalog.components.map((c) => c.name).toSorted())
    for (const c of catalog.components) {
      const def = chatLibrary.components[c.name]
      expect(def).toBeDefined()
      expect(Object.keys(def!.props.shape)).toEqual(c.props.map((p) => p.name))
    }
  })

  it("studio library holds only studio components", () => {
    const studio = catalog.components.filter((c) => c.subsets.includes("studio")).map((c) => c.name)
    expect(Object.keys(studioLibrary.components).toSorted()).toEqual(studio.toSorted())
  })
})
