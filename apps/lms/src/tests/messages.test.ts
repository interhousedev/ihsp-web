/** GEN-3: every text of the LMS app exists in uz, ru and en with the same keys and the same placeholders. */
import { describe, expect, it } from "bun:test"
import type { Messages } from "@ihsp/i18n"
import en from "../../messages/en.json"
import ru from "../../messages/ru.json"
import uz from "../../messages/uz.json"

function flatten(tree: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") result.set(path, value)
    else for (const [inner, text] of flatten(value, path)) result.set(inner, text)
  }
  return result
}

/** The `{name}` placeholders of a message (plural branches are skipped, they differ by language). */
function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(\w+)[,}]/g)].map((match) => match[1] ?? ""))].toSorted()
}

const reference = flatten(en as Messages)

describe("LMS messages", () => {
  for (const [locale, tree] of [
    ["ru", ru],
    ["uz", uz],
  ] as const) {
    const messages = flatten(tree as Messages)

    it(`${locale} has the keys of en and nothing else`, () => {
      expect([...messages.keys()].toSorted()).toEqual([...reference.keys()].toSorted())
    })

    it(`${locale} keeps the placeholders of every en message`, () => {
      const broken = [...reference].filter(
        ([key, text]) => JSON.stringify(placeholders(messages.get(key) ?? "")) !== JSON.stringify(placeholders(text)),
      )
      expect(broken.map(([key]) => key)).toEqual([])
    })
  }
})
