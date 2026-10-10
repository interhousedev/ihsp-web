import { describe, expect, it } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const webRoot = resolve(import.meta.dir, "../../../..")
const allowed = resolve(webRoot, "packages/ui/src/components/icons.tsx")
const skip = new Set(["node_modules", ".next", "dist", ".turbo", "coverage"])

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

describe("icon registry", () => {
  it("only ui/components/icons.tsx imports @tabler/icons-react", () => {
    const offenders = [join(webRoot, "apps"), join(webRoot, "packages")]
      .flatMap((d) => walk(d))
      .filter((f) => f !== allowed && f !== import.meta.path)
      .filter((f) =>
        /from\s+["']@tabler\/icons-react["']|import\(["']@tabler\/icons-react["']\)/.test(readFileSync(f, "utf8")),
      )
      .map((f) => relative(webRoot, f))
    expect(offenders).toEqual([])
  })
})
