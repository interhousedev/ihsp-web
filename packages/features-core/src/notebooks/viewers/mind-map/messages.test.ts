import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { Messages } from "@ihsp/i18n"
import { notebookMessages } from "../../test-support"

const SOURCE_DIR = import.meta.dir
const MESSAGES_DIR = join(import.meta.dir, "../../../../../../apps/sp/messages")

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
}

function lookup(messages: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages)
}

const locales = ["en", "ru", "uz"] as const

describe("mind map messages", () => {
  test("the three locales have the same keys in notebooks.json", () => {
    const keys = locales.map((locale) =>
      flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, locale, "notebooks.json"), "utf8"))).toSorted(),
    )

    expect(keys[1]).toEqual(keys[0] ?? [])
    expect(keys[2]).toEqual(keys[0] ?? [])
  })

  test("every key the viewer uses exists in every locale", () => {
    const used = new Set<string>()
    for (const name of readdirSync(SOURCE_DIR)) {
      if (!/\.tsx?$/.test(name) || name.includes(".test.")) continue
      const source = readFileSync(join(SOURCE_DIR, name), "utf8")
      for (const match of source.matchAll(/\bt\("((?:mindmap|viewer)\.[\w.]+)"/g)) used.add(match[1] ?? "")
    }

    expect(used.size).toBeGreaterThan(15)
    for (const locale of locales) {
      const messages = notebookMessages(locale)
      for (const key of used) {
        expect(typeof lookup(messages, `notebooks.${key}`), `${locale}: notebooks.${key}`).toBe("string")
      }
    }
  })

  test("the prompt keeps the label placeholder in every locale", () => {
    for (const locale of locales) {
      expect(String(lookup(notebookMessages(locale), "notebooks.mindmap.prompt"))).toContain("{label}")
    }
  })

  test("the viewer has no hard-coded text in its JSX", () => {
    for (const name of readdirSync(SOURCE_DIR)) {
      if (!name.endsWith(".tsx") || name.includes(".test.")) continue
      const source = readFileSync(join(SOURCE_DIR, name), "utf8")
      // Letters between an opening tag and the next closing tag, outside `{...}` expressions.
      const literal = [...source.matchAll(/<[A-Za-z][^<>]*>\s*([A-Za-z][^<>{}]*?)\s*<\//g)].map((match) => match[1])
      expect(literal, name).toEqual([])
    }
  })
})
