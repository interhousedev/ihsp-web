import { describe, expect, it } from "bun:test"
import en from "@ihsp/i18n/messages/en.json"
import ru from "@ihsp/i18n/messages/ru.json"
import uz from "@ihsp/i18n/messages/uz.json"

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : leaves(value, `${prefix}${key}.`),
  )
}

/** The names of the `{placeholders}` of a message, ignoring plural bodies. */
function placeholders(message: string): string[] {
  const names = new Set<string>()
  for (const match of message.matchAll(/\{(\w+)(?:,|\})/g)) if (match[1]) names.add(match[1])
  return [...names].toSorted()
}

function valueAt(tree: Tree, path: string): string {
  let node: string | Tree | undefined = tree
  for (const part of path.split(".")) node = typeof node === "object" ? node[part] : undefined
  return typeof node === "string" ? node : ""
}

describe("flashcards messages", () => {
  const english = en.flashcards as Tree
  const keys = leaves(english)

  it("has the same keys in uz, ru and en", () => {
    expect(leaves(ru.flashcards as Tree).toSorted()).toEqual([...keys].toSorted())
    expect(leaves(uz.flashcards as Tree).toSorted()).toEqual([...keys].toSorted())
  })

  it("uses the same placeholders in every language", () => {
    for (const key of keys) {
      const expected = placeholders(valueAt(english, key))
      expect({ key, ru: placeholders(valueAt(ru.flashcards as Tree, key)) }).toEqual({ key, ru: expected })
      expect({ key, uz: placeholders(valueAt(uz.flashcards as Tree, key)) }).toEqual({ key, uz: expected })
    }
  })

  it("has no empty message", () => {
    for (const tree of [en, ru, uz]) {
      for (const key of keys) expect(valueAt(tree.flashcards as Tree, key).length).toBeGreaterThan(0)
    }
  })
})
