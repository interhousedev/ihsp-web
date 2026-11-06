import { describe, expect, it } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import allowlist from "./card-radius.allowlist.json"

/**
 * Card-like containers use the `rounded-card` token (`Card` does). A single className string that combines a border
 * (or `ring-1`) with `rounded-xl` / `rounded-2xl` is a card in the wrong radius. Controls in `components/ui/` are
 * exempt. The allowlist holds files whose shape is deliberate; it is a ratchet: a file may leave it, none may join it.
 */
const webRoot = resolve(import.meta.dir, "../../../..")
const skip = new Set(["node_modules", ".next", "out", "dist", ".turbo", "coverage", "__tests__"])
const STRING = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(p)
  }
  return out
}

function isOffender(text: string): boolean {
  for (const literal of text.match(STRING) ?? []) {
    if (!/rounded-(?:xl|2xl)/.test(literal)) continue
    const tokens = literal.slice(1, -1).split(/\s+/)
    const bare = tokens.map((t) => t.slice(t.lastIndexOf(":") + 1))
    const rounded = bare.some((t) => t === "rounded-xl" || t === "rounded-2xl")
    const border = bare.some((t) => /^border(?:-[trblxyse])?(?:-\d+)?$/.test(t) || t === "ring-1")
    if (rounded && border) return true
  }
  return false
}

function offenders(): string[] {
  const roots = [
    ...readdirSync(join(webRoot, "apps")).map((app) => join(webRoot, "apps", app, "src")),
    ...readdirSync(join(webRoot, "packages")).map((pkg) => join(webRoot, "packages", pkg, "src")),
  ].filter((dir) => {
    try {
      return statSync(dir).isDirectory()
    } catch {
      return false
    }
  })
  return roots
    .flatMap((dir) => walk(dir))
    .filter((file) => !file.includes("/packages/ui/src/components/ui/"))
    .filter((file) => isOffender(readFileSync(file, "utf8")))
    .map((file) => relative(webRoot, file))
    .toSorted()
}

describe("card radius", () => {
  const found = offenders()
  const allowed = new Set<string>(allowlist)

  it("no new file combines a border with rounded-xl or rounded-2xl (use rounded-card)", () => {
    expect(found.filter((file) => !allowed.has(file))).toEqual([])
  })

  it("files that were cleaned up leave the allowlist (deleted files are ignored)", () => {
    const current = new Set(found)
    expect([...allowed].filter((file) => existsSync(join(webRoot, file)) && !current.has(file))).toEqual([])
  })
})
