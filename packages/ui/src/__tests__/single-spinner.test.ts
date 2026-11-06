import { describe, expect, it } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

/**
 * One loading spinner everywhere: `Spinner` from `@ihsp/ui`. No file may spin an icon by hand (`Icons.spinner`,
 * `IconLoader2`, `animate-spin`); the component itself is the only exception.
 */
const webRoot = resolve(import.meta.dir, "../../../..")
const skip = new Set(["node_modules", ".next", "out", "dist", ".turbo", "coverage", "__tests__"])
const SPINNER_FILE = "packages/ui/src/components/ui/spinner.tsx"
const HAND_ROLLED = /Icons\.spinner|IconLoader2|animate-spin/

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
    .map((file) => relative(webRoot, file))
    .filter((file) => file !== SPINNER_FILE && HAND_ROLLED.test(readFileSync(join(webRoot, file), "utf8")))
    .sort()
}

describe("single spinner", () => {
  it("only spinner.tsx spins an icon; everything else uses <Spinner />", () => {
    expect(offenders()).toEqual([])
  })
})
