/** GEN-3: every text of this app exists in uz, ru and en, and every key used in the code has a message. */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import shared from "@ihsp/i18n/messages/en.json"
import { messages } from "./helpers"

const ROOT = join(import.meta.dir, "..", "..", "..", "..")
/** Feature flags of the platform settings page that have a translated name and description. */
const LIMIT_FEATURES = [
  "assistant",
  "notebook_chat",
  "notebook_prep",
  "studio",
  "lms_author",
  "web_search",
  "embedding",
  "academic",
  "other",
]
const LIMIT_ROLES = ["student", "teacher", "admin", "staff", "system"]
const LIMIT_FIELDS = [
  "ai_text_max_bytes",
  "ai_session_hours",
  "ai_session_tokens_student",
  "ai_daily_tokens_student",
  "ai_max_tool_steps",
  "ai_smart_requests_per_week_student",
  "nb_session_tokens_student",
  "nb_daily_tokens_student",
  "nb_artifacts_per_day",
  "nb_audio_per_day",
  "nb_slides_per_day",
  "nb_infographics_per_day",
  "nb_concurrent_artifacts",
  "nb_chat_per_minute",
  "nb_source_adds_per_hour",
  "nb_search_per_minute",
  "web_search_per_day_student",
  "web_search_max_results",
  "web_search_discover_results",
  "web_search_deep_queries",
  "web_search_deep_results",
  "lms_ai_chat_per_minute",
  "lms_ai_max_tool_steps",
]
const FEATURE_FLAGS = [
  "notebooks",
  "ai_assistant",
  "flashcards",
  "lms",
  "mail",
  "push",
  "emis_sync",
  "library",
  "web_search",
  "vector_search",
  "change_password_on_login",
]
/** Message keys of the identity audit event codes (`features/shared/utils/audit-events.ts`). */
const AUDIT_EVENT_KEYS = [
  "loginSuccess",
  "loginFailed",
  "logout",
  "passwordChanged",
  "passwordReset",
  "passwordResetByAdmin",
  "otpEnabled",
  "otpDisabled",
  "otpResetRequested",
  "otpResetCancelled",
  "otpResetApplied",
  "otpResetByAdmin",
  "emailChanged",
  "telegramLinked",
  "telegramUnlinked",
  "sessionRevoked",
  "sessionsRevoked",
  "connectorCreated",
  "connectorRevoked",
  "roleGranted",
  "roleRevoked",
  "userCreated",
  "userRegistered",
  "userUpdated",
  "userBlocked",
  "userUnblocked",
  "userActivated",
  "userDeactivated",
  "userDeleted",
  "userPurged",
  "accountDeleted",
  "accountReclaimed",
  "studentViewed",
  "mailSuspended",
  "mailResumed",
  "oauthClientVerified",
  "emisPasswordUpdated",
]
/** The shared features read their texts from the namespaces of the app that uses them. */
const SOURCES = [
  "apps/admin/src",
  "packages/features-core/src/assistant-chat",
  "packages/features-core/src/file-upload-button",
  "packages/features-core/src/lesson-detail",
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
    if (statSync(path).isDirectory())
      return name === "tests" || name === "node_modules" || name === "__tests__" ? [] : sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

/** `{count}`, `{date}` ... the top-level argument names of an ICU message (plural branches are not inspected). */
function argumentNames(text: string): string[] {
  const names = new Set<string>()
  let depth = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === "{") {
      if (depth === 0) {
        const match = /^\{\s*(\w+)\s*[,}]/.exec(text.slice(index))
        if (match) names.add(match[1] as string)
      }
      depth += 1
    } else if (char === "}") {
      depth -= 1
    }
  }
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
      const text = readFileSync(file, "utf8")
      // A file can have several components, each with its own `const t = useT("...")`: a call belongs to the
      // nearest binding of that name above it.
      const bindings = [...text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useT\(\s*(?:"([^"]*)")?\s*\)/g)].map((match) => ({
        name: match[1] as string,
        namespace: match[2] ?? "",
        at: match.index ?? 0,
      }))
      for (const name of new Set(bindings.map((binding) => binding.name))) {
        for (const call of text.matchAll(new RegExp(`\\b${name}\\(\\s*(["\`])([^"\`]+)\\1`, "g"))) {
          const owner = bindings.filter((binding) => binding.name === name && binding.at < (call.index ?? 0)).at(-1)
          if (!owner) continue
          const key = call[2] as string
          const full = owner.namespace ? `${owner.namespace}.${key}` : key
          if (key.includes("${")) dynamic.set(full, path)
          else used.set(full, path)
        }
      }
    }
  }

  test("the scan found the keys", () => {
    expect(used.size).toBeGreaterThan(400)
  })

  test("every key used in the code has an English message", () => {
    const missing = [...used].filter(([key]) => !available.has(key)).map(([key, file]) => `${key} (${file})`)
    expect(missing).toEqual([])
  })

  test("the keys built at run time have messages for every value", () => {
    const roles = ["student", "teacher", "admin", "lms_admin"]
    const views = ["group", "student", "subject", "teacher"]
    const expected: Record<string, string[]> = {
      // The student assistant workspace (features-core/assistant-chat) shares this folder with the admin chat.
      "assistant.home.greeting${greeting}": ["1", "2", "3", "4"],
      "assistant.slash.${chip}.title": ["explain", "cards", "quiz", "summary", "mindmap", "table"],
      "assistant.slash.${chip}.hint": ["explain", "cards", "quiz", "summary", "mindmap", "table"],
      "assistant.slash.${item.name}.title": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "assistant.slash.${item.name}.hint": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "assistant.slash.${name}.title": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "assistant.slash.${name}.hint": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "assistant.slash.${name}.args": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "assistant.slash.${command}.args": [
        "goal",
        "cards",
        "quiz",
        "summary",
        "mindmap",
        "slides",
        "report",
        "table",
        "explain",
        "translate",
        "help",
      ],
      "attendance.report.labels.${state.view}": views,
      "attendance.report.views.${view}": views,
      "broadcasts.audience.role.${role}": roles,
      "broadcasts.status.${value}": ["draft", "scheduled", "sending", "sent", "cancelled"],
      "files.picker.types.${value}": ["pdf", "doc", "sheet", "slides", "text", "image"],
      "files.drive.types.${entry.id}": ["all", "documents", "images", "video", "presentations", "spreadsheets", "pdf"],
      "assistant.sidebar.folders.${folder}": ["subject", "course", "mine"],
      "lessonDetail.header.fields.${change.field}": ["room", "teacher", "subject", "date", "period"],
      "lessons.status.${lesson.status}": ["scheduled", "cancelled"],
      "moderation.kind.${item.link.kind}": ["url", "file", "chat", "flashcard_set"],
      "students.tabs.${name}": ["overview", "timetable", "grades", "attendance", "account"],
      "teachers.status.${value}": ["active", "pending_activation", "deactivated", "blocked"],
      "terms.editor.issues.${issue}": [
        "year",
        "dates",
        "order",
        "noBells",
        "bellTime",
        "bellWeekdays",
        "bellDuplicate",
        "controlIncomplete",
        "controlOrder",
        "controlOutside",
        "controlSequence",
      ],
      "settings.languages.${locale}": ["uz", "ru", "en"],
      "settings.featureLabels.${key}": FEATURE_FLAGS,
      "settings.featureDescriptions.${key}": FEATURE_FLAGS,
      "account.auditEvents.${key}": AUDIT_EVENT_KEYS,
      "timetable.editor.conflictKind.${conflict.kind}": ["teacher", "room", "audience"],
      "timetable.entity.${view}": ["group", "teacher", "room"],
      "timetable.noEntities.${view}": ["group", "teacher", "room"],
      "timetable.parityShort.${entry.week_parity}": ["odd", "even"],
      "timetable.views.${item}": ["group", "teacher", "room"],
      "limits.features.${name}": LIMIT_FEATURES,
      "limits.roles.${user.role}": LIMIT_ROLES,
      "limits.roles.${key}": LIMIT_ROLES,
      "limits.fields.${item.key}.label": LIMIT_FIELDS,
      "limits.fields.${item.key}.hint": LIMIT_FIELDS,
      "limits.editor.groups.${group}": ["assistant", "smart", "notebooks", "web_search", "lms"],
      "limits.editor.unit.${item.unit}": ["tokens", "steps", "hours", "bytes"],
      "limits.editor.period.${item.period}": ["session", "day", "week", "minute", "hour"],
      "users.roles.${role}": [...roles, "lms_creator", "librarian"],
      "users.status.${value}": ["active", "pending_activation", "blocked", "deactivated"],
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

  test("every status word the badges can show has a translation", () => {
    for (const status of [
      "active",
      "blocked",
      "left",
      "archived",
      "cancelled",
      "pending_activation",
      "deactivated",
      "draft",
      "scheduled",
      "sending",
      "sent",
      "success",
      "running",
      "needs_reauth",
    ]) {
      expect(available.has(`status.${status}`), status).toBe(true)
    }
  })

  test("the error types the admin pages handle have messages", () => {
    for (const type of [
      "common.conflict",
      "common.validation",
      "common.forbidden",
      "id.user-not-found",
      "academic.term-control-periods-invalid",
      "academic.assessment-not-found",
      "academic.not-assessment-teacher",
      "academic.assessment-subject-not-found",
      "academic.invalid-assessment",
      "academic.assessment-exists",
    ]) {
      expect(available.has(`errors.${type}`), type).toBe(true)
    }
  })
})
