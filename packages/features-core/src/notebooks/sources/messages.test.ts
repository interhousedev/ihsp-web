import { describe, expect, it } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { Messages } from "@ihsp/i18n"
import { IntlMessageFormat } from "intl-messageformat"
import { notebookMessages } from "../test-support"

const SOURCE_DIR = import.meta.dir
const MESSAGES_DIR = join(import.meta.dir, "../../../../../apps/sp/messages")
const SHARED_DIR = join(import.meta.dir, "../../../../i18n/messages")
const locales = ["en", "ru", "uz"] as const

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
}

function lookup(messages: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages)
}

function partFile(locale: string): Messages {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, locale, "notebooks.json"), "utf8")) as Messages
}

/** The keys passed to `t("...")` in the components, plus the ones built at run time. */
function usedKeys(): string[] {
  const used = new Set<string>()
  for (const name of readdirSync(SOURCE_DIR)) {
    if (!/\.tsx?$/.test(name) || name.includes(".test.")) continue
    const source = readFileSync(join(SOURCE_DIR, name), "utf8")
    for (const match of source.matchAll(/\bt\(\s*"([\w.]+)"/g)) used.add(match[1] ?? "")
  }
  for (const id of ["files", "chats", "lessons", "flashcards", "courses", "text", "link"]) used.add(`add.tab.${id}`)
  for (const status of ["pending", "processing", "failed", "unavailable", "stale"]) used.add(`status.${status}`)
  for (const kind of ["file", "chat", "lesson_resource", "flashcard_set", "lms_step", "note", "text", "url"]) {
    used.add(`group.${kind}`)
  }
  for (const code of [
    "unsupported_type",
    "no_text",
    "no_transcript",
    "too_large",
    "fetch_failed",
    "forbidden",
    "deleted",
    "provider_error",
  ]) {
    used.add(`failure.${code}`)
  }
  used.add("add.lessons.material")
  used.add("add.lessons.attachment")
  return [...used].filter((key) => key !== "")
}

/** Keys read with `useT()` and no namespace are full paths: `notebooks.…`, or the shared messages of `@ihsp/i18n`. */
const isShared = (key: string) => key.startsWith("state.") || key.startsWith("files.")

describe("sources messages", () => {
  it("the three locales have the same keys", () => {
    const keys = locales.map((locale) => flatten(partFile(locale)).toSorted())

    expect(keys[1]).toEqual(keys[0] ?? [])
    expect(keys[2]).toEqual(keys[0] ?? [])
  })

  it("every key the components use exists in every locale", () => {
    const used = usedKeys()

    expect(used.length).toBeGreaterThan(60)
    for (const locale of locales) {
      const messages = notebookMessages(locale)
      const shared = JSON.parse(readFileSync(join(SHARED_DIR, `${locale}.json`), "utf8")) as Messages
      for (const key of used) {
        const found = isShared(key)
          ? lookup(shared, key)
          : lookup(messages, key.startsWith("notebooks.") ? key : `notebooks.${key}`)
        expect(typeof found, `${locale}: ${key}`).toBe("string")
      }
    }
  })

  it("every message formats with sample values, plurals included", () => {
    for (const locale of locales) {
      const messages = partFile(locale)
      for (const key of flatten(messages)) {
        const message = String(lookup(messages, key))
        // Every `{name}` argument gets a value: a number for plural arguments, a word for the others.
        const values = Object.fromEntries(
          [...message.matchAll(/\{(\w+)(,)?/g)].map((match) => [match[1], match[2] ? 2 : "x"]),
        )
        expect(() => new IntlMessageFormat(message, locale).format(values), `${locale}: ${key}`).not.toThrow()
      }
    }
  })

  it("Russian plural messages have the few and many forms", () => {
    const messages = partFile("ru")
    for (const key of flatten(messages)) {
      const message = String(lookup(messages, key))
      if (!message.includes("plural,")) continue
      expect(message, key).toContain("few {")
      expect(message, key).toContain("many {")
    }
  })

  it("the components have no hard-coded text in their JSX", () => {
    for (const name of readdirSync(SOURCE_DIR)) {
      if (!name.endsWith(".tsx") || name.includes(".test.")) continue
      const source = readFileSync(join(SOURCE_DIR, name), "utf8")
      // Letters between an opening tag and the next closing tag, outside `{...}` expressions.
      const literal = [...source.matchAll(/<[A-Za-z][^<>]*>\s*([A-Za-z][^<>{}]*?)\s*<\//g)].map((match) => match[1])
      expect(literal, name).toEqual([])
    }
  })
})
