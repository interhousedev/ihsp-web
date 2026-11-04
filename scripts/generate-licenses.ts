/**
 * Writes packages/features-core/src/license/generated/licenses.json: the open source packages the web apps ship
 * (production dependencies, from bun.lock and node_modules) and the backend's Python packages (the backend's
 * licenses/python.json, written by `uv run python scripts/export_licenses.py`).
 *
 *   bun run generate-licenses            (the backend is read from ${IHSP_BACKEND_DIR:-../iht-backend})
 *
 * Run it after any dependency change and commit the regenerated file. Output is sorted, so diffs stay small.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUTPUT = join(ROOT, "packages/features-core/src/license/generated/licenses.json")
const UNKNOWN = "UNKNOWN"

type Dependencies = Partial<
  Record<"dependencies" | "optionalDependencies" | "peerDependencies", Record<string, string>>
>
type LockEntry = [ident: string, registry?: string, meta?: Dependencies & Record<string, unknown>, integrity?: string]
type Lock = {
  workspaces: Record<string, Dependencies & { devDependencies?: Record<string, string> }>
  packages: Record<string, LockEntry>
}
export type LicenseRow = { name: string; version: string; license: string; url: string; ecosystem: "npm" | "PyPI" }

/** bun.lock is JSON with trailing commas and no comments; drop the commas outside strings, then parse. */
export function parseBunLock(text: string): Lock {
  let out = ""
  let inString = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!
    if (inString) {
      out += char
      if (char === "\\") out += text[++index] ?? ""
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    if (char === ",") {
      const next = text.slice(index + 1).trimStart()[0]
      if (next === "}" || next === "]") continue
    }
    out += char
  }
  return JSON.parse(out) as Lock
}

/** The lock key of `name` as seen from `base` (a package or workspace key): nested copies first, then the hoisted one. */
function resolveKey(lock: Lock, base: string, name: string): string | undefined {
  let scope = base
  for (;;) {
    const candidate = scope ? `${scope}/${name}` : name
    if (lock.packages[candidate]) return candidate
    if (!scope) return undefined
    scope = parentScope(scope)
  }
}

/** The key one package level up: a scoped name (`@scope/name`) takes two segments. */
function parentScope(key: string): string {
  const parts = key.split("/")
  const size = parts.length >= 2 && parts[parts.length - 2]!.startsWith("@") ? 2 : 1
  return parts.slice(0, -size).join("/")
}

/** The packages a production install contains: everything reachable from the workspaces' non-dev dependencies. */
export function productionKeys(lock: Lock): string[] {
  const seen = new Set<string>()
  const queue: [base: string, name: string][] = []
  for (const [workspace, manifest] of Object.entries(lock.workspaces)) {
    for (const name of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies })) {
      queue.push([workspace, name])
    }
  }
  while (queue.length > 0) {
    const [base, name] = queue.shift()!
    const key = resolveKey(lock, base, name)
    if (!key || seen.has(key)) continue
    const entry = lock.packages[key]!
    if (entry[0].includes("workspace:")) continue
    seen.add(key)
    const meta = entry[2] ?? {}
    const children = [meta.dependencies, meta.optionalDependencies, meta.peerDependencies]
    for (const group of children) {
      for (const child of Object.keys((group as Record<string, string> | undefined) ?? {})) queue.push([key, child])
    }
  }
  return [...seen]
}

function readManifest(path: string): Record<string, unknown> | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>) : null
}

/** A link the page may open: https only, a repository URL turned into its web page. */
export function webLink(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null
  const url = value
    .trim()
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^git@([^:]+):/, "https://$1/")
    .replace(/^github:/, "https://github.com/")
    .replace(/\.git$/, "")
  if (/^[\w.-]+\/[\w.-]+$/.test(url)) return `https://github.com/${url}`
  return url.startsWith("https://") ? url : null
}

export function npmLicense(manifest: Record<string, unknown>): string {
  const raw = manifest.license ?? manifest.licenses
  if (typeof raw === "string") return raw.trim() || UNKNOWN
  if (Array.isArray(raw)) {
    const types = raw.map((item) => (typeof item === "string" ? item : (item as { type?: string })?.type))
    return types.filter(Boolean).join(" OR ") || UNKNOWN
  }
  const type = (raw as { type?: unknown } | undefined)?.type
  return typeof type === "string" && type.trim() ? type.trim() : UNKNOWN
}

/** The install folder of a lock key: `a/b` is `node_modules/a/node_modules/b` (nested copies keep their parent). */
export function installPath(key: string): string {
  const parts = key.split("/")
  const names: string[] = []
  for (let index = 0; index < parts.length; index++) {
    const scoped = parts[index]!.startsWith("@") && index + 1 < parts.length
    names.push(scoped ? `${parts[index]}/${parts[++index]}` : parts[index]!)
  }
  return join(ROOT, ...names.flatMap((name) => ["node_modules", name]))
}

/** Packages of other platforms (optional native builds) are not installed here and are left out. */
function npmRows(lock: Lock): { rows: LicenseRow[]; notInstalled: string[] } {
  const rows: LicenseRow[] = []
  const notInstalled: string[] = []
  for (const key of productionKeys(lock)) {
    const ident = lock.packages[key]![0]
    const at = ident.lastIndexOf("@")
    const name = ident.slice(0, at)
    const version = ident.slice(at + 1)
    const manifest = readManifest(join(installPath(key), "package.json"))
    if (!manifest) {
      notInstalled.push(`${name}@${version}`)
      continue
    }
    const repository =
      typeof manifest.repository === "object"
        ? (manifest.repository as { url?: string } | null)?.url
        : manifest.repository
    const url = webLink(manifest.homepage) ?? webLink(repository) ?? `https://www.npmjs.com/package/${name}`
    rows.push({ name, version, license: npmLicense(manifest), url, ecosystem: "npm" })
  }
  return { rows, notInstalled }
}

function backendRows(): LicenseRow[] {
  const backend = resolve(ROOT, process.env.IHSP_BACKEND_DIR ?? "../iht-backend")
  const path = join(backend, "licenses/python.json")
  if (!existsSync(path)) {
    throw new Error(`${path} is missing: run \`uv run python scripts/export_licenses.py\` in the backend first`)
  }
  const data = JSON.parse(readFileSync(path, "utf8")) as { packages: LicenseRow[] }
  return data.packages.map((row) => ({
    name: String(row.name),
    version: String(row.version),
    license: String(row.license || UNKNOWN),
    url: webLink(row.url) ?? `https://pypi.org/project/${row.name}/`,
    ecosystem: "PyPI" as const,
  }))
}

export function sortRows(rows: LicenseRow[]): LicenseRow[] {
  const unique = new Map<string, LicenseRow>()
  for (const row of rows) unique.set(`${row.ecosystem}\0${row.name}\0${row.version}`, row)
  return [...unique.values()].toSorted(
    (a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
      a.ecosystem.localeCompare(b.ecosystem) ||
      a.version.localeCompare(b.version),
  )
}

function main() {
  const lock = parseBunLock(readFileSync(join(ROOT, "bun.lock"), "utf8"))
  const npm = npmRows(lock)
  const rows = sortRows([...npm.rows, ...backendRows()])
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, `${JSON.stringify({ packages: rows }, null, 2)}\n`)
  const unknown = rows.filter((row) => row.license === UNKNOWN).length
  process.stdout.write(`${OUTPUT}: ${rows.length} packages, ${unknown} without license\n`)
  if (npm.notInstalled.length > 0) {
    process.stdout.write(
      `skipped ${npm.notInstalled.length} not installed on this machine: ${npm.notInstalled.join(", ")}\n`,
    )
  }
}

if (import.meta.main) main()
