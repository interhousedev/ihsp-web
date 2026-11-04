/** The license texts exist in uz, ru and en with the same keys and placeholders; the old source-code links are gone. */
import { describe, expect, test } from "bun:test"
import en from "@ihsp/i18n/messages/en.json"
import ru from "@ihsp/i18n/messages/ru.json"
import uz from "@ihsp/i18n/messages/uz.json"

type Tree = { [key: string]: string | Tree }

function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  )
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").toSorted()
}

function get(tree: Tree, path: string): unknown {
  return path.split(".").reduce<unknown>((node, part) => (node as Tree)[part], tree)
}

describe("license messages", () => {
  const english = en.license as Tree
  const englishKeys = keys(english).toSorted()

  test("uz and ru have the keys of en", () => {
    expect(keys(ru.license as Tree).toSorted()).toEqual(englishKeys)
    expect(keys(uz.license as Tree).toSorted()).toEqual(englishKeys)
  })

  test("every language uses the same placeholders", () => {
    for (const path of englishKeys) {
      const expected = placeholders(String(get(english, path)))
      expect(placeholders(String(get(ru.license as Tree, path)))).toEqual(expected)
      expect(placeholders(String(get(uz.license as Tree, path)))).toEqual(expected)
    }
  })

  test("the source-code link labels are removed from common in every language", () => {
    for (const messages of [en, ru, uz]) {
      expect(Object.keys(messages.common)).not.toContain("sourceCodeWeb")
      expect(Object.keys(messages.common)).not.toContain("sourceCodeBackend")
    }
  })
})
