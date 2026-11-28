/**
 * Every literal translation key used in the source exists in uz, ru and en.
 *
 * A key that is missing shows up on screen as the raw key (`timetable.hideOtherSubgroup`). The scan is static: it finds
 * `const t = useT("namespace")` and the calls `t("key")`, `t.rich("key")`, `t.raw("key")`, `t.has("key")` made with
 * that name afterwards in the same file. Keys built at run time (template strings, variables) cannot be checked here;
 * the ones that are known to be fine are listed in `DYNAMIC_PREFIXES` and `DYNAMIC_NAMESPACES` with the reason.
 */
import { describe, expect, test } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { LOCALES, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"

const ROOT = join(import.meta.dir, "..", "..", "..", "..")
const APPS_DIR = join(ROOT, "apps")
const PACKAGES_DIR = join(ROOT, "packages")

/** Message files that an app loads next to its own `messages/<locale>.json` (see its `providers.tsx`). */
const SP = (name: string) => join("apps", "sp", "messages", "<locale>", `${name}.json`)
const EXTRA_FILES: Record<string, string[]> = {
  sp: ["tools", "notebooks", "pwa", "honours", "student-card", "rating", "club-media", "homework-review"].map(SP),
  lms: [SP("notebooks")],
  share: [SP("notebooks")],
  staff: [SP("notebooks")],
}
/** The library apps merge the `library` namespace of `@ihsp/features-core`. */
const LIBRARY_AREAS = ["catalog", "manage", "reader", "upload"]

/** Keys that start with one of these are chosen at run time; the usage is not a literal in the source. */
const DYNAMIC_PREFIXES: string[] = []
/** Namespaces of `useT(...)` that are built at run time (`useT(`notebooks.${scope}`)`): calls through them are skipped. */
const DYNAMIC_NAMESPACES: string[] = []

function readJson(path: string): Messages {
  return JSON.parse(readFileSync(path, "utf8")) as Messages
}

function appBundle(app: string | null, locale: Locale): Messages {
  let bundle = readJson(join(PACKAGES_DIR, "i18n", "messages", `${locale}.json`))
  if (app === null) {
    // A package is used by several apps: its keys may be provided by any of them.
    for (const name of readdirSync(APPS_DIR).filter((dir) => statSync(join(APPS_DIR, dir)).isDirectory()))
      bundle = mergeMessages(bundle, appBundleOnly(name, locale))
    return bundle
  }
  return mergeMessages(bundle, appBundleOnly(app, locale))
}

function appBundleOnly(app: string, locale: Locale): Messages {
  let bundle = readJson(join(APPS_DIR, app, "messages", `${locale}.json`))
  for (const extra of EXTRA_FILES[app] ?? []) {
    bundle = mergeMessages(bundle, readJson(join(ROOT, extra.replace("<locale>", locale))))
  }
  if (app === "library") {
    const library: Messages = {}
    for (const area of LIBRARY_AREAS) {
      Object.assign(
        library,
        readJson(join(PACKAGES_DIR, "features-core", "src", "library", "messages", locale, `${area}.json`)),
      )
    }
    bundle = mergeMessages(bundle, { library })
  }
  return bundle
}

function hasKey(messages: Messages, path: string): boolean {
  let node: string | Messages | undefined = messages
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return false
    node = node[part]
  }
  return typeof node === "string"
}

function isSourceFile(path: string): boolean {
  if (!/\.(ts|tsx)$/.test(path) || path.endsWith(".d.ts")) return false
  return !/\.test\.tsx?$|[\\/]__tests__[\\/]|[\\/]tests[\\/]|[\\/]generated[\\/]/.test(path)
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (isSourceFile(path)) out.push(path)
  }
  return out
}

type Usage = { file: string; line: number; key: string }

const DECLARATION = /\b(?:const|let)\s+(\w+)\s*=\s*useT\(\s*(?:"([^"]*)"|'([^']*)'|(`[^`]*`))?\s*\)/g
const CALL = /(?<![\w.$])(\w+)(?:\.(?:rich|raw|markup|has))?\(\s*(?:"([^"\\]+)"|'([^'\\]+)')/g

/** The literal keys (namespace included) that `source` translates. */
export function scanUsages(source: string, file: string): Usage[] {
  const declarations: { name: string; at: number; namespace: string | null }[] = []
  for (const match of source.matchAll(DECLARATION)) {
    const dynamic = match[4] !== undefined || DYNAMIC_NAMESPACES.includes(match[2] ?? "")
    declarations.push({ name: match[1]!, at: match.index!, namespace: dynamic ? null : (match[2] ?? match[3] ?? "") })
  }
  const names = new Set(declarations.map((declaration) => declaration.name))
  const usages: Usage[] = []
  for (const match of source.matchAll(CALL)) {
    const name = match[1]!
    if (!names.has(name)) continue
    const at = match.index!
    const declaration = declarations.filter((candidate) => candidate.name === name && candidate.at < at).at(-1)
    if (!declaration || declaration.namespace === null) continue
    const local = match[2] ?? match[3]!
    const key = declaration.namespace ? `${declaration.namespace}.${local}` : local
    if (DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix))) continue
    usages.push({ file, line: source.slice(0, at).split("\n").length, key })
  }
  return usages
}

describe("translation key usage", () => {
  test("scanner understands the patterns of the codebase", () => {
    const source = [
      `const t = useT("timetable")`,
      `const common = useT()`,
      `t("showOtherSubgroup")`,
      `t.rich('legend', {})`,
      `common("common.save")`,
      `t(\`dynamic.\${x}\`)`,
      `other("not.declared")`,
    ].join("\n")
    expect(scanUsages(source, "x.tsx").map((usage) => usage.key)).toEqual([
      "timetable.showOtherSubgroup",
      "timetable.legend",
      "common.save",
    ])
  })

  const groups: { label: string; app: string | null; dir: string }[] = [
    ...readdirSync(APPS_DIR)
      .filter((name) => statSync(join(APPS_DIR, name)).isDirectory())
      .map((name) => ({ label: `apps/${name}`, app: name, dir: join(APPS_DIR, name, "src") })),
    ...readdirSync(PACKAGES_DIR)
      .filter((name) => name !== "test-utils" && existsSync(join(PACKAGES_DIR, name, "src")))
      .map((name) => ({ label: `packages/${name}`, app: null, dir: join(PACKAGES_DIR, name, "src") })),
  ]

  test("the scan finds the usages (guards against a broken pattern)", () => {
    const total = groups
      .flatMap((group) => walk(group.dir))
      .flatMap((file) => scanUsages(readFileSync(file, "utf8"), file))
    expect(total.length).toBeGreaterThan(3000)
  })

  for (const group of groups) {
    test(`${group.label}: every literal key exists in uz, ru and en`, () => {
      const usages = walk(group.dir).flatMap((file) => scanUsages(readFileSync(file, "utf8"), file))
      const missing: string[] = []
      for (const locale of LOCALES) {
        const bundle = appBundle(group.app, locale)
        for (const usage of usages) {
          if (!hasKey(bundle, usage.key)) {
            missing.push(`${locale}: ${usage.key} (${usage.file.slice(ROOT.length + 1)}:${usage.line})`)
          }
        }
      }
      expect(missing).toEqual([])
    })
  }
})
