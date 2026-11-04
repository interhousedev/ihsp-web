import { createParser, type Library } from "@openuidev/react-lang"
import catalog from "./catalog.json"
import { safeHttpsUrl } from "./safe"

// The same rules as the backend validator (app/shared/openui/validate.py), checked on the
// shared corpus (corpus.json). The parser alone accepts partial trees and state references.
const UNSAFE_TEXT = /<\s*\/?\s*(script|iframe|object|embed|style)|javascript:/i
const STRING = /"(?:\\.|[^"\\\n])*"/g
const URL_PROP = /\burl\s*:\s*"((?:\\.|[^"\\])*)"/g
const ROOT = /^\s*root\s*=/m

/** True when the block parses to a complete tree that the catalogue allows, with no missing references. */
export function isRenderable(code: string, library: Library): boolean {
  if (!ROOT.test(code) || UNSAFE_TEXT.test(code) || hasUnsafeSource(code)) return false
  try {
    const result = createParser(library.toJSONSchema(), library.root).parse(code)
    return (
      result.root !== null &&
      result.meta.errors.length === 0 &&
      result.meta.unresolved.length === 0 &&
      !hasProblem(result.root)
    )
  } catch {
    return false
  }
}

/** State references and functions, and links that are not https, outside of the strings' text. */
function hasUnsafeSource(code: string): boolean {
  if (/[$@]/.test(code.replace(STRING, '""'))) return true
  for (const match of code.matchAll(URL_PROP)) {
    const url = match[1] ?? ""
    if (safeHttpsUrl(url) === null || /\s/.test(url)) return true
  }
  return false
}

type ElementNode = {
  type?: unknown
  typeName?: unknown
  props?: Record<string, unknown>
  partial?: unknown
  hasDynamicProps?: unknown
}

/** A partial or dynamic element, or a list longer than its catalogue maximum, anywhere in the tree. */
function hasProblem(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasProblem)
  if (!value || typeof value !== "object") return false
  const node = value as ElementNode
  if (node.type !== "element" || typeof node.typeName !== "string") return false
  if (node.partial === true || node.hasDynamicProps === true) return true
  const spec = catalog.components.find((c) => c.name === node.typeName)
  for (const prop of spec?.props ?? []) {
    const list = node.props?.[prop.name]
    const max = (prop as { max?: number }).max
    if (Array.isArray(list) && max !== undefined && list.length > max) return true
  }
  return Object.values(node.props ?? {}).some(hasProblem)
}
