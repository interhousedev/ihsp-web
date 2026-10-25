/**
 * WEB-31 to WEB-36, GEN-3: the notebooks and assistant texts exist in uz, ru and en, every key used in the code has a
 * message, and no user-facing text is hard-coded in the notebooks and assistant folders.
 */
import { describe, expect, test } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import shared from "@ihsp/i18n/messages/en.json"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import ts from "typescript"

const ROOT = join(import.meta.dir, "..", "..", "..", "..")
const MESSAGES_DIR = join(ROOT, "apps/sp/messages")

/** Folders whose texts live in `notebooks.json` (the new notebooks code and the Gemini-style assistant). */
const FOLDERS = [
  "packages/features-core/src/notebooks",
  "packages/features-core/src/assistant-chat",
  "apps/sp/src/features/notebooks",
  "apps/sp/src/features/assistant",
  "apps/sp/src/app/notebooks",
  "apps/sp/src/app/assistant",
]

function loadLocale(locale: string): Messages {
  const dir = join(MESSAGES_DIR, locale)
  return readdirSync(dir)
    .filter((name) => /^notebooks(\..+)?\.json$/.test(name))
    .toSorted()
    .reduce<Messages>((merged, name) => mergeMessages(merged, JSON.parse(readFileSync(join(dir, name), "utf8"))), {})
}

function flatten(tree: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") result.set(path, value)
    else for (const [inner, text] of flatten(value, path)) result.set(inner, text)
  }
  return result
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : sourceFiles(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== "test-support.tsx" ? [path] : []
  })
}

/** `{count}`, `{date}` ... the argument names of an ICU message. */
function argumentNames(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(/\{(\w+)(?:,|\})/g)) names.add(match[1] as string)
  return [...names].toSorted()
}

const en = flatten(loadLocale("en"))
const ru = flatten(loadLocale("ru"))
const uz = flatten(loadLocale("uz"))
const available = flatten(mergeMessages(shared as Messages, loadLocale("en")))
// Keys that other message files of this app (tools.json, <locale>.json) provide.
for (const [key] of flatten(
  mergeMessages(
    JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf8")) as Messages,
    JSON.parse(readFileSync(join(MESSAGES_DIR, "en/tools.json"), "utf8")) as Messages,
  ),
)) {
  available.set(key, "")
}

describe("notebooks message files", () => {
  test("uz and ru have exactly the keys of en", () => {
    expect([...ru.keys()].toSorted()).toEqual([...en.keys()].toSorted())
    expect([...uz.keys()].toSorted()).toEqual([...en.keys()].toSorted())
  })

  test("no message is empty", () => {
    for (const [locale, map] of [
      ["en", en],
      ["ru", ru],
      ["uz", uz],
    ] as const) {
      for (const [key, text] of map) expect(text.trim(), `${locale}: ${key}`).not.toBe("")
    }
  })

  test("a message uses the same arguments in every language", () => {
    for (const [key, text] of en) {
      expect(argumentNames(ru.get(key) ?? ""), `ru: ${key}`).toEqual(argumentNames(text))
      expect(argumentNames(uz.get(key) ?? ""), `uz: ${key}`).toEqual(argumentNames(text))
    }
  })

  test("Russian plural messages have the few and many forms", () => {
    for (const [key, text] of ru) {
      if (!text.includes(", plural,")) continue
      if (/\bone\s*\{/.test(text)) {
        expect(text, `ru: ${key}`).toMatch(/\bfew\s*\{/)
        expect(text, `ru: ${key}`).toMatch(/\bmany\s*\{/)
      }
    }
  })

  test("Uzbek uses the modifier letter apostrophe, not a plain one, inside words", () => {
    for (const [key, text] of uz) expect(text, `uz: ${key}`).not.toMatch(/[a-z]['’][a-z]/i)
  })
})

describe("keys used in the notebooks and assistant code", () => {
  const used = new Map<string, string>()
  const dynamic = new Map<string, string>()

  for (const folder of FOLDERS) {
    for (const file of sourceFiles(join(ROOT, folder))) {
      const path = relative(ROOT, file)
      const text = readFileSync(file, "utf8")
      const namespaces = new Map<string, string>()
      for (const match of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useT\(\s*(?:"([^"]*)")?\s*\)/g)) {
        namespaces.set(match[1] as string, match[2] ?? "")
      }
      for (const [name, namespace] of namespaces) {
        for (const call of text.matchAll(new RegExp(`\\b${name}(?:\\.has)?\\(\\s*(["\`])([^"\`]+)\\1`, "g"))) {
          const key = call[2] as string
          const full = namespace ? `${namespace}.${key}` : key
          if (key.includes("${")) dynamic.set(full, path)
          else used.set(full, path)
        }
      }
    }
  }

  test("every key used in the code has an English message", () => {
    const missing = [...used].filter(([key]) => !available.has(key)).map(([key, file]) => `${key} (${file})`)
    expect(missing).toEqual([])
  })

  test("every key built at run time has messages under its prefix", () => {
    const bad = [...dynamic]
      .filter(([pattern]) => {
        const prefix = pattern.slice(0, pattern.indexOf("${"))
        return ![...available.keys()].some((key) => key.startsWith(prefix))
      })
      .map(([pattern, file]) => `${pattern} (${file})`)
    expect(bad).toEqual([])
  })
})

/** Attributes whose text a user reads or hears. */
const TEXT_ATTRIBUTES = new Set(["aria-label", "placeholder", "title", "alt", "aria-description", "label"])

function hardCodedText(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  function visit(node: ts.Node) {
    if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) {
      found.push(`text "${node.text.trim().slice(0, 40)}"`)
    }
    if (
      ts.isJsxAttribute(node) &&
      TEXT_ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      /\p{L}/u.test(node.initializer.text)
    ) {
      found.push(`${node.name.getText(source)}="${node.initializer.text.slice(0, 40)}"`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe("no hard-coded text", () => {
  test("JSX text and text attributes of the notebooks and assistant components come from messages", () => {
    const offenders: string[] = []
    for (const folder of FOLDERS) {
      for (const file of sourceFiles(join(ROOT, folder))) {
        if (!file.endsWith(".tsx")) continue
        for (const issue of hardCodedText(file)) offenders.push(`${relative(ROOT, file)}: ${issue}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
