import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const SRC = join(import.meta.dir, "..")

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === "tests" || name === "__tests__" || name === "node_modules") continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

describe("admin tables use the shared look", () => {
  test("no raw <table> element in apps/admin/src", () => {
    const offenders = walk(SRC).filter((file) => /<table[\s>]/.test(readFileSync(file, "utf8")))
    expect(offenders).toEqual([])
  })
})
