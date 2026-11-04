import { describe, expect, it } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { assetPaths, brandManifest, brandOfflinePage } from "../../scripts/generate-brand-assets"
import { BRAND_MESSAGE_VALUES, BRAND_PWA_APPS, fillBrand } from "../brand"

/**
 * Brand names live in `packages/config/src/brand.ts`. Code and messages elsewhere use `BRAND` or a message placeholder;
 * tests may assert the rendered names. Comments are ignored in code, because prose about the product is no output.
 */
const webRoot = resolve(import.meta.dir, "../../../..")
const LITERAL = /\b(?:IHT|Interhouse|International House)\b|\b(?:my|staff|lms|library|admin|id)\.iht\b/
const ALLOWED = new Set(["packages/config/src/brand.ts", "packages/config/src/__tests__/brand-literals.test.ts"])
const skip = new Set(["node_modules", ".next", "out", "dist", ".turbo", "coverage", "__tests__", "tests", "generated"])

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx?|mjs|css|json)$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith(".d.ts"))
      out.push(path)
  }
  return out
}

function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

function inGroup(group: string): string[] {
  return readdirSync(join(webRoot, group))
    .filter((name) => name !== "test-utils")
    .flatMap((name) => [join(webRoot, group, name, "src"), join(webRoot, group, name, "messages")])
}

function roots(): string[] {
  return [...inGroup("apps"), ...inGroup("packages")].filter((dir) => {
    try {
      return statSync(dir).isDirectory()
    } catch {
      return false
    }
  })
}

describe("brand names", () => {
  it("no code or message outside the config holds a literal brand name", () => {
    const found = roots()
      .flatMap((dir) => walk(dir))
      .filter((file) => !ALLOWED.has(relative(webRoot, file)))
      .filter((file) => LITERAL.test(withoutComments(readFileSync(file, "utf8"))))
      .map((file) => relative(webRoot, file))
    expect(found).toEqual([])
  })

  it("the manifests and offline pages match the config (bun run build:brand)", () => {
    for (const app of BRAND_PWA_APPS) {
      const { manifest, offline } = assetPaths(app)
      const manifestText = readFileSync(manifest, "utf8")
      const offlineText = readFileSync(offline, "utf8")
      expect(brandManifest(manifestText, app)).toBe(manifestText)
      expect(brandOfflinePage(offlineText, app)).toBe(offlineText)
    }
  })

  it("fills only its own placeholders and escapes ICU quotes", () => {
    expect(fillBrand("{brand} and {count}")).toBe(`${BRAND_MESSAGE_VALUES.brand} and {count}`)
    expect(fillBrand("{app}")).toBe("{app}")
  })
})
