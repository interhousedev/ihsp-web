/** GEN-3: every text of this app exists in uz, ru and en, and every key used in the code has a message. */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import shared from "@ihsp/i18n/messages/en.json"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { messages } from "./helpers"

const ROOT = join(import.meta.dir, "..", "..", "..", "..")
/** Folders whose keys live in `messages/<locale>/tools.json` (study tools) or `notebooks.json` (notebooks). */
const STUDY_TOOLS = [
  "features/assistant",
  "features/flashcards",
  "features/files",
  "features/links",
  "app/assistant",
  "app/flashcards",
  "app/files",
  "app/links",
  // Notebooks: keys live in `messages/<locale>/notebooks.json`, checked by nb-messages.test.ts.
  "features/notebooks",
  "app/notebooks",
  // The installable app: keys live in `messages/<locale>/pwa.json`, checked by pwa-messages.test.ts.
  "features/pwa",
]
const SOURCES = [
  "apps/sp/src",
  "packages/features-core/src/notification-center",
  "packages/features-core/src/notification-bell",
  "packages/features-core/src/notification-settings-form",
]

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
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === "tests" || name === "node_modules" ? [] : sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx") ? [path] : []
  })
}

/** `{count}`, `{date}` … the argument names of an ICU message (plural branches only add `#`). */
function argumentNames(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(/\{(\w+)(?:,|\})/g)) names.add(match[1] as string)
  return [...names].toSorted()
}

const en = flatten(messages.en)
const ru = flatten(messages.ru)
const uz = flatten(messages.uz)
const available = flatten(mergeMessages(shared as Messages, messages.en))

describe("message files", () => {
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
})

describe("keys used in the code", () => {
  const used = new Map<string, string>()
  const dynamic = new Map<string, string>()

  for (const source of SOURCES) {
    for (const file of sourceFiles(join(ROOT, source))) {
      const path = relative(ROOT, file)
      if (STUDY_TOOLS.some((folder) => path.includes(folder))) continue
      const text = readFileSync(file, "utf8")
      const namespaces = new Map<string, string>()
      for (const match of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useT\(\s*(?:"([^"]*)")?\s*\)/g)) {
        namespaces.set(match[1] as string, match[2] ?? "")
      }
      for (const [name, namespace] of namespaces) {
        for (const call of text.matchAll(new RegExp(`\\b${name}\\(\\s*(["\`])([^"\`]+)\\1`, "g"))) {
          const key = call[2] as string
          const full = namespace ? `${namespace}.${key}` : key
          if (key.includes("${")) dynamic.set(full, path)
          else used.set(full, path)
        }
      }
    }
  }

  test("the scan found the keys", () => {
    expect(used.size).toBeGreaterThan(150)
  })

  test("every key used in the code has an English message", () => {
    const missing = [...used].filter(([key]) => !available.has(key)).map(([key, file]) => `${key} (${file})`)
    expect(missing).toEqual([])
  })

  test("the keys built at run time have messages for every value", () => {
    const expected: Record<string, string[]> = {
      "nav.short.${id}": [
        "today",
        "timetable",
        "subjects",
        "grades",
        "attendance",
        "homework",
        "exams",
        "assistant",
        "notebooks",
        "flashcards",
        "files",
        "links",
        "notifications",
        "settings",
      ],
      "notifications.filters.${value}": ["all", "activity", "announcements"],
      "notificationSettings.marks.type.${value}": ["lesson", "midterm", "final"],
      "today.alerts.actions.${alert.kind}": [
        "emis_reauth",
        "no_subgroup",
        "files_expiring",
        "pending_approvals",
        "sync_failed",
      ],
      "today.getStarted.steps.${step.id}.title": ["telegram", "subgroup", "notifications"],
      "today.getStarted.steps.${step.id}.text": ["telegram", "subgroup", "notifications"],
      "today.getStarted.steps.${step.id}.action": ["telegram", "subgroup", "notifications"],
      "today.dashboard.kinds.${widget.kind}": [
        "timetable",
        "homework",
        "marks",
        "exams",
        "flashcards_due",
        "notebook_prompt",
        "attendance",
        "clock_next_lesson",
      ],
      "today.dashboard.kinds.${kind}": [
        "timetable",
        "homework",
        "marks",
        "exams",
        "flashcards_due",
        "notebook_prompt",
        "attendance",
        "clock_next_lesson",
      ],
      "today.dashboard.notebookPrompt.templates.${index}": ["0", "1", "2", "3"],
      "today.marks.type.${mark.type}": ["lesson", "midterm", "final"],
      "grades.tabs.${value}": ["semester", "day", "record"],
      "grades.day.type.${mark.type}": ["lesson", "midterm", "final"],
      "homework.tabs.${value}": ["upcoming", "later", "done"],
      "homework.empty.${tab}": ["upcoming", "later", "done"],
      "subjects.tabs.${value}": ["overview", "lessons", "marks", "materials"],
      "subjects.overview.type.${type}": ["lesson", "midterm", "final"],
      "subjects.marks.type.${value}": ["all", "lesson", "midterm", "final"],
      "subjects.marks.type.${mark.type}": ["lesson", "midterm", "final"],
      "subjects.hub.kind.${row.kind}": ["lecture", "practice", "midterm", "final", "other"],
      "timetable.fields.${change.field}": ["room", "teacher", "subject", "date", "period", "topic"],
      "settings.general.themes.${value}": ["light", "dark", "system"],
      "settings.today.cards.${card.id}": ["now", "timeline", "due", "marks", "semester", "announcements", "alerts"],
    }
    const unknown = [...dynamic.keys()].filter((key) => !(key in expected))
    expect(unknown).toEqual([])
    for (const [pattern, values] of Object.entries(expected)) {
      for (const value of values) {
        const key = pattern.replace(/\$\{[^}]+\}/, value)
        expect(available.has(key), key).toBe(true)
      }
    }
  })

  test("attendance states have a message", () => {
    for (const state of ["present", "absent", "excused", "not_taken"])
      expect(available.has(`attendanceStates.${state}`)).toBe(true)
  })
})
