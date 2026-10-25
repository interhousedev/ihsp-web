// Generates `src/contract-check.ts`: compile-time assertions that every hand-written endpoint type fits the OpenAPI
// schema the backend exports (`packages/api/openapi.json`, vendored from the iht-backend repo by `bun run sync:openapi` → `src/generated/openapi.d.ts`, see `bun run gen:api`).
//
// Each endpoint function of `src/endpoints/*.ts` carries a doc comment `/** METHOD /path — auth. … */`. For every one
// the script emits up to three assignments that the TypeScript compiler checks (never executed):
//   - the hand-written response type must be assignable to the generated 2xx JSON response schema,
//   - the hand-written `body` type must be assignable to the generated JSON request body,
//   - the hand-written `params` type must be assignable to the generated query parameters.
// The path is matched with the OpenAPI document when it exists (parameter names may differ: `{id}` ↔ `{lesson_id}`).
//
//   bun packages/api/scripts/gen-contract-check.ts            # writes src/contract-check.ts, prints a coverage report
//   bun x tsc -p packages/api/tsconfig.contract.json --noEmit  # runs the assertions

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const API_DIR = join(import.meta.dir, "..")
const ENDPOINTS_DIR = join(API_DIR, "src/endpoints")
const OPENAPI_JSON = process.env.OPENAPI_JSON ?? join(API_DIR, "openapi.json")
const OUTPUT = join(API_DIR, "src/contract-check.ts")

const out = (line = "") => process.stdout.write(`${line}\n`)

type Method = "get" | "post" | "put" | "patch" | "delete"

type Endpoint = {
  file: string
  fn: string
  method: Method
  path: string
  bodyType: string | null
  paramsType: string | null
}

const DOC = /\/\*\*\s*(?:\n\s*\*\s*)?(GET|POST|PUT|PATCH|DELETE) (\/[^\s]*)/g

/** Text of the parameter list of the function that starts at `from` (balanced parentheses). */
function signatureOf(source: string, from: number): string {
  const open = source.indexOf("(", from)
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (char === "(") depth += 1
    if (char === ")") {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, index)
    }
  }
  return ""
}

/** Splits a parameter list on top-level commas. */
function splitParameters(list: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const char of list) {
    if ("<({[".includes(char)) depth += 1
    if (">)}]".includes(char)) depth -= 1
    if (char === "," && depth === 0) {
      parts.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function typeOfParameter(parameters: string[], names: string[]): string | null {
  for (const parameter of parameters) {
    const match = parameter.match(/^(\w+)\??:\s*(.+)$/s)
    if (match && names.includes(match[1] ?? "")) {
      const type = (match[2] ?? "").trim()
      // Only simple named types can be imported by the generated file.
      return /^[A-Z]\w*$/.test(type) ? type : null
    }
  }
  return null
}

function scanEndpoints(): Endpoint[] {
  const endpoints: Endpoint[] = []
  for (const file of readdirSync(ENDPOINTS_DIR)
    .filter((name) => name.endsWith(".ts"))
    .toSorted()) {
    const source = readFileSync(join(ENDPOINTS_DIR, file), "utf8")
    for (const match of source.matchAll(DOC)) {
      const after = (match.index ?? 0) + match[0].length
      const fnMatch = /export function (\w+)/g
      fnMatch.lastIndex = after
      const found = fnMatch.exec(source)
      if (!found || source.slice(after, found.index).includes("/**")) continue
      const parameters = splitParameters(signatureOf(source, found.index))
      endpoints.push({
        file,
        fn: found[1] ?? "",
        method: (match[1] ?? "GET").toLowerCase() as Method,
        path: (match[2] ?? "").split("?")[0] ?? "",
        bodyType: typeOfParameter(parameters, ["body"]),
        paramsType: typeOfParameter(parameters, ["params"]),
      })
    }
  }
  return endpoints
}

function exportedFunctions(): Map<string, string> {
  const all = new Map<string, string>()
  for (const file of readdirSync(ENDPOINTS_DIR).filter((name) => name.endsWith(".ts"))) {
    const source = readFileSync(join(ENDPOINTS_DIR, file), "utf8")
    for (const match of source.matchAll(/export function (\w+)/g)) all.set(match[1] ?? "", file)
  }
  return all
}

/** `{anything}` → `{}` so `/v1/x/{id}` and `/v1/x/{lesson_id}` compare equal. */
const normalize = (path: string) => path.replace(/\{[^}]*\}/g, "{}")

type OpenApiOperation = { responses?: Record<string, { content?: Record<string, unknown> }> }
type OpenApi = { paths: Record<string, Partial<Record<Method, OpenApiOperation>>> }

/** Does the operation answer 200/201/202 with a JSON body? (204, CSV, calendar and HTML answers cannot be compared.) */
function hasJsonSuccess(operation: OpenApiOperation | undefined): boolean {
  if (!operation?.responses) return true
  return ["200", "201", "202"].some(
    (status) => operation.responses?.[status]?.content?.["application/json"] !== undefined,
  )
}

function loadOpenApi(): OpenApi | null {
  if (!existsSync(OPENAPI_JSON)) return null
  return JSON.parse(readFileSync(OPENAPI_JSON, "utf8")) as OpenApi
}

const openapi = loadOpenApi()
const endpoints = scanEndpoints()
const functions = exportedFunctions()

const byTemplate = new Map<string, string[]>()
if (openapi) {
  for (const path of Object.keys(openapi.paths)) {
    const key = normalize(path)
    byTemplate.set(key, [...(byTemplate.get(key) ?? []), path])
  }
}

const rows: string[] = []
const reverseRows: string[] = []
const missingInOpenApi: string[] = []
const typeImports = new Map<string, Set<string>>()
const functionImports = new Map<string, Set<string>>()

function addImport(map: Map<string, Set<string>>, from: string, name: string) {
  map.set(from, (map.get(from) ?? new Set<string>()).add(name))
}

// The type modules each endpoint file imports from; a named type is looked up in all of them.
const typeFiles = readdirSync(join(API_DIR, "src/types")).filter((name) => name.endsWith(".ts"))
const typeOwner = new Map<string, string>()
for (const file of typeFiles) {
  const source = readFileSync(join(API_DIR, "src/types", file), "utf8")
  for (const match of source.matchAll(/export (?:type|interface) (\w+)/g))
    typeOwner.set(match[1] ?? "", file.replace(/\.ts$/, ""))
}

const covered = new Set<string>()
for (const endpoint of endpoints) {
  let path = endpoint.path
  if (openapi) {
    const candidates = byTemplate.get(normalize(path)) ?? []
    const match = candidates.find((candidate) => openapi.paths[candidate]?.[endpoint.method])
    if (!match) {
      missingInOpenApi.push(`${endpoint.method.toUpperCase()} ${endpoint.path}  (${endpoint.fn})`)
      continue
    }
    path = match
    covered.add(`${endpoint.method} ${match}`)
  }
  const key = JSON.stringify(path)
  const method = JSON.stringify(endpoint.method)
  rows.push(`// ${endpoint.method.toUpperCase()} ${path} — ${endpoint.fn}`)
  if (hasJsonSuccess(openapi?.paths[path]?.[endpoint.method])) {
    addImport(functionImports, endpoint.file.replace(/\.ts$/, ""), endpoint.fn)
    rows.push(`declare const res_${endpoint.fn}: Awaited<ReturnType<typeof ${endpoint.fn}>>`)
    rows.push(`export const response_${endpoint.fn}: ResponseOf<${key}, ${method}> = res_${endpoint.fn}`)
    // The safer direction for responses: whatever the backend sends must fit the type the web code relies on.
    reverseRows.push(`// ${endpoint.method.toUpperCase()} ${path} — ${endpoint.fn}`)
    reverseRows.push(`declare const gen_${endpoint.fn}: ResponseOf<${key}, ${method}>`)
    reverseRows.push(
      `export const served_${endpoint.fn}: Awaited<ReturnType<typeof ${endpoint.fn}>> = gen_${endpoint.fn}`,
    )
    reverseRows.push("")
  } else {
    rows.push("// no JSON success response (204, CSV, calendar or HTML): only the route is checked")
    rows.push(`export type route_${endpoint.fn} = OperationOf<${key}, ${method}>`)
  }
  if (endpoint.bodyType && typeOwner.has(endpoint.bodyType)) {
    addImport(typeImports, typeOwner.get(endpoint.bodyType) ?? "", endpoint.bodyType)
    rows.push(`declare const req_${endpoint.fn}: ${endpoint.bodyType}`)
    rows.push(`export const request_${endpoint.fn}: RequestOf<${key}, ${method}> = req_${endpoint.fn}`)
  }
  if (endpoint.paramsType && typeOwner.has(endpoint.paramsType)) {
    addImport(typeImports, typeOwner.get(endpoint.paramsType) ?? "", endpoint.paramsType)
    rows.push(`declare const query_${endpoint.fn}: ${endpoint.paramsType}`)
    rows.push(`export const query_ok_${endpoint.fn}: QueryOf<${key}, ${method}> = query_${endpoint.fn}`)
  }
  rows.push("")
}

const header = `// GENERATED by packages/api/scripts/gen-contract-check.ts (\`bun run gen:contract\`) — do not edit by hand.
//
// Compile-time contract check between the hand-written endpoint types and the OpenAPI schema exported by the backend
// (\`packages/api/openapi.json\` → \`src/generated/openapi.d.ts\`, \`bun run gen:api\`). The file is never executed: it only
// has to type-check (\`bun run contract:check\`). A compile error on a row means the backend response, request body or
// query differs from the hand-written type of that endpoint function; fix the type or report the backend deviation.

import type { paths } from "./generated/openapi"
`

const baseHelpers = `
type Method = "get" | "post" | "put" | "patch" | "delete"
type OperationOf<P extends keyof paths, M extends Method> = paths[P] extends Record<M, infer O> ? O : never
type JsonOf<R> = R extends { content: { "application/json": infer J } } ? J : never
type SuccessJson<P extends keyof paths, M extends Method> =
  OperationOf<P, M> extends { responses: infer R } ? JsonOf<R[Extract<keyof R, 200 | 201 | 202>]> : never
`

const forwardHelpers = `${baseHelpers}
/**
 * Allows \`null\` everywhere. Several endpoints share one hand-written type (\`SubjectRef\`, \`RoomRefLite\`, ...) while the
 * backend declares a field nullable in one view and not in another; the hand-written type is the wider one. This check
 * therefore ignores nullability and verifies names, structure and value sets; the reverse check
 * (\`contract-check-reverse.ts\`) verifies that every value the backend can send is handled, \`null\` included.
 */
type Loose<T> = T extends readonly (infer U)[]
  ? Loose<U>[] | null
  : T extends object
    ? { [K in keyof T]: Loose<T[K]> } | null
    : T | null

/** The JSON body of the 200/201/202 response of an operation (never when it has none). */
type ResponseOf<P extends keyof paths, M extends Method> = Loose<SuccessJson<P, M>>

/** The JSON request body of an operation. */
type RequestOf<P extends keyof paths, M extends Method> =
  OperationOf<P, M> extends { requestBody?: infer B } ? JsonOf<NonNullable<B>> : never

/** The query parameters of an operation. */
type QueryOf<P extends keyof paths, M extends Method> =
  OperationOf<P, M> extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never
`

const reverseHelpers = `${baseHelpers}
/** The JSON body of the 200/201/202 response of an operation, exactly as the backend declares it. */
type ResponseOf<P extends keyof paths, M extends Method> = SuccessJson<P, M>
`

const imports: string[] = []
for (const [file, names] of [...functionImports].toSorted()) {
  imports.push(`import type { ${[...names].toSorted().join(", ")} } from "./endpoints/${file}"`)
}
for (const [file, names] of [...typeImports].toSorted()) {
  imports.push(`import type { ${[...names].toSorted().join(", ")} } from "./types/${file}"`)
}

if (openapi === null) {
  console.warn("backend/openapi/openapi.json not found: paths are taken from the doc comments unchecked.")
}

writeFileSync(OUTPUT, `${header}${imports.join("\n")}\n${forwardHelpers}\n${rows.join("\n")}\n`)

const REVERSE_OUTPUT = join(API_DIR, "src/contract-check-reverse.ts")
const reverseHeader = header
  // Fields with a default are always present in a response: this document keeps them required (`gen:api`).
  .replace('"./generated/openapi"', '"./generated/openapi-served"')
  .replace("Compile-time contract check", "Reverse compile-time contract check (informational)")
  .replace(
    "A compile error on a row",
    "Here the generated response schema must be assignable to the hand-written type, i.e. the backend sends nothing\n// the web code does not expect. A compile error on a row",
  )
const functionImportsOnly = [...functionImports]
  .toSorted()
  .map(([file, names]) => `import type { ${[...names].toSorted().join(", ")} } from "./endpoints/${file}"`)
writeFileSync(
  REVERSE_OUTPUT,
  `${reverseHeader}${functionImportsOnly.join("\n")}\n${reverseHelpers}\n${reverseRows.join("\n")}\n`,
)

// --- Coverage report (stdout) ---
const unparsed = [...functions.keys()].filter(
  (fn) => !endpoints.some((endpoint) => endpoint.fn === fn) && !/Query$|^(seg|api)$/.test(fn),
)
out(`endpoint functions with a doc comment: ${endpoints.length}`)
if (unparsed.length > 0)
  out(`exported functions without a "METHOD /path" doc comment (not checked): ${unparsed.join(", ")}`)
if (openapi) {
  const operations: string[] = []
  for (const [path, item] of Object.entries(openapi.paths)) {
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      if (item[method]) operations.push(`${method} ${path}`)
    }
  }
  const unused = operations.filter((operation) => !covered.has(operation))
  out(`OpenAPI operations: ${operations.length}, with a typed web function: ${covered.size}`)
  if (missingInOpenApi.length > 0) {
    out(`\nweb functions whose METHOD + path is NOT in the OpenAPI document (${missingInOpenApi.length}):`)
    for (const line of missingInOpenApi) out(`  ${line}`)
  }
  out(`\nOpenAPI operations without a web function (${unused.length}):`)
  for (const line of unused) out(`  ${line}`)
}
