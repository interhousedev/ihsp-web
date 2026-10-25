import { readFileSync } from "node:fs"
import { describe, expect, it } from "bun:test"
import { UPLOAD_KINDS } from "../upload/upload-config"
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

  // The keys a component reads: `t("...")` literals, `t(value)` for the values it lists, and `${value}Hint` templates.
  const readKeys = (file: string, names: readonly string[]): string[] => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8")
    const literal = [...source.matchAll(/\bt\("([^"]+)"\)/g)].map((match) => match[1] ?? "")
    const templated = [...source.matchAll(/\bt\(`\$\{\w+\}(\w+)`\)/g)].flatMap((match) =>
      names.map((name) => `${name}${match[1] ?? ""}`),
    )
    return [...new Set([...literal, ...templated, ...names])]
  }
  const screens = [
    {
      name: "book visibility",
      keys: readKeys("../manage/editor/visibility-fields.tsx", ["lyceum", "public"]),
      area: "manage.editor.visibility",
    },
    { name: "upload kind", keys: readKeys("../upload/step-kind.tsx", UPLOAD_KINDS), area: "upload.kind" },
  ] as const

  for (const screen of screens) {
    it(`${screen.name}: every key the component reads exists in uz, ru and en`, () => {
      const missing = Object.entries({ en, ru, uz }).flatMap(([locale, messages]) =>
        screen.keys
          .map((key) => `${screen.area}.${key}`)
          .filter((path) => {
            const text = valueAt((messages as { library: Tree }).library, path)
            return text.trim() === ""
          })
          .map((path) => `${locale}:${path}`),
      )
      expect(missing).toEqual([])
    })
  }
})

/** The text at a dotted path, or "" when it is missing or not a message. */
function valueAt(tree: Tree, path: string): string {
  let node: string | Tree | undefined = tree
  for (const part of path.split(".")) node = typeof node === "object" ? node[part] : undefined
  return typeof node === "string" ? node : ""
}
