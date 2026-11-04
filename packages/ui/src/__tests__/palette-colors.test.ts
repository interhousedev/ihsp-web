import { describe, expect, it } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import allowlist from "./palette-colors.allowlist.json"

/**
 * Colours go through the theme tokens (`bg-success-muted`, `text-mark-5`, `text-destructive` …), never raw Tailwind
 * palette classes or hex values, so every theme and dark mode keep working. The allowlist holds the files that still
 * break the rule; it is a ratchet: a file may leave it, none may join it.
 */
const webRoot = resolve(import.meta.dir, "../../../..")
const skip = new Set(["node_modules", ".next", "out", "dist", ".turbo", "coverage", "__tests__"])
const PALETTE =
  /\b(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|divide|fill|stroke|from|via|to|shadow|decoration|accent|caret|placeholder)-(?:red|green|emerald|amber|yellow|orange|blue|sky|lime|teal|cyan|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/
const HEX = /["'`\s(:,]#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(p)
  }
  return out
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
    .filter((file) => {
      const text = readFileSync(file, "utf8")
      return PALETTE.test(text) || HEX.test(text)
    })
    .map((file) => relative(webRoot, file))
    .sort()
}

describe("theme colours", () => {
  const found = offenders()
  const allowed = new Set<string>(allowlist)

  it("no new file uses raw palette colour classes or hex colours", () => {
    expect(found.filter((file) => !allowed.has(file))).toEqual([])
  })

  it("files that were cleaned up leave the allowlist (deleted files are ignored)", () => {
    const current = new Set(found)
    expect([...allowed].filter((file) => existsSync(join(webRoot, file)) && !current.has(file))).toEqual([])
  })
})
