import { describe, expect, it } from "bun:test"
import en from "./en/index"
import ru from "./ru/index"
import uz from "./uz/index"
import { areas as enAreas } from "./en/index"
import { areas as ruAreas } from "./ru/index"
import { areas as uzAreas } from "./uz/index"

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`),
  )
}

function values(tree: Tree): string[] {
  return Object.values(tree).flatMap((value) => (typeof value === "string" ? [value] : values(value)))
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((match) => match[1]).toSorted()

const locales = { en: enAreas, ru: ruAreas, uz: uzAreas } as const
const areaNames = Object.keys(enAreas) as (keyof typeof enAreas)[]

describe("library messages", () => {
  for (const area of areaNames) {
    it(`${area}: uz, ru and en have the same keys`, () => {
      const expected = flatten(enAreas[area] as Tree).toSorted()
      expect(flatten(ruAreas[area] as Tree).toSorted()).toEqual(expected)
      expect(flatten(uzAreas[area] as Tree).toSorted()).toEqual(expected)
    })
  }

  it("each area owns distinct top-level keys", () => {
    for (const [name, areas] of Object.entries(locales)) {
      const all = Object.values(areas).flatMap((area) => Object.keys(area))
      expect({ name, duplicates: all.filter((key, index) => all.indexOf(key) !== index) }).toEqual({
        name,
        duplicates: [],
      })
    }
  })

  it("has no empty texts and the same placeholders in every locale", () => {
    const flat = (tree: Tree, prefix = ""): [string, string][] =>
      Object.entries(tree).flatMap(([key, value]) =>
        typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : flat(value, `${prefix}${key}.`),
      )
    const enFlat = new Map(flat(en as Tree))
    for (const messages of [ru as Tree, uz as Tree]) {
      for (const [key, text] of flat(messages)) {
        expect({ key, empty: text.trim() === "" }).toEqual({ key, empty: false })
        const original = enFlat.get(key)
        if (original !== undefined) expect({ key, p: placeholders(text) }).toEqual({ key, p: placeholders(original) })
      }
    }
    expect(values(en as Tree).every((text) => text.trim() !== "")).toBe(true)
  })
})
