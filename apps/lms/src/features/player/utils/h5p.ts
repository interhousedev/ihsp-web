import type { XapiStatement } from "@ihsp/api"
import { getConfig } from "@ihsp/config"

/** The self-hosted player frame (apps/lms/scripts/copy-h5p.mjs copies it from h5p-standalone). */
export const H5P_FRAME_JS = "/h5p-player/frame.bundle.js"
export const H5P_FRAME_CSS = "/h5p-player/styles/h5p.css"

const XAPI_COMPLETED = "http://adlnet.gov/expapi/verbs/completed"
const XAPI_ANSWERED = "http://adlnet.gov/expapi/verbs/answered"

/**
 * Where the package files are read from. The API answers a signed path; in production the LMS host proxies
 * `/v1/lms/h5p/` to the API, so the path stays same-origin (the page CSP allows scripts from 'self' only). The
 * Next.js dev server has no such proxy, so there the API origin is put in front.
 */
export function h5pBaseUrl(path: string, dev = process.env.NODE_ENV === "development"): string {
  const base = path.endsWith("/") ? path.slice(0, -1) : path
  return dev ? `${getConfig().API_URL}${base}` : base
}

/** Only results of the whole content are sent: sub-questions report with a parent, progress verbs carry no score. */
export function isResultStatement(statement: XapiStatement): boolean {
  const verb = statement.verb?.id
  if (verb !== XAPI_COMPLETED && verb !== XAPI_ANSWERED) return false
  if ((statement.context?.contextActivities?.parent ?? []).length > 0) return false
  return statement.result !== undefined
}

/** The part of the statement the server needs (no actor: the server knows who is asking). */
export function trimStatement(statement: XapiStatement): XapiStatement {
  return {
    verb: { id: statement.verb?.id },
    result: statement.result,
    ...(statement.context?.contextActivities?.parent ? { context: statement.context } : {}),
  }
}

/** The player document runs in an iframe with exactly this sandbox: scripts only, no same-origin (opaque origin). */
export const H5P_SANDBOX = "allow-scripts"
export const H5P_PLAYER_PAGE = "/h5p-player/player.html"
export const H5P_XAPI_MESSAGE = "ihsp-h5p-xapi"
export const H5P_SIZE_MESSAGE = "ihsp-h5p-size"
const MAX_HEIGHT = 20_000

/**
 * The iframe address: the player page, told where the package is and which origin the parent (the LMS) has, through
 * the hash. The frame posts its messages to that origin only.
 */
export function h5pPlayerSrc(base: string, id: string, parentOrigin: string): string {
  return `${H5P_PLAYER_PAGE}#${new URLSearchParams({ base, id, origin: parentOrigin }).toString()}`
}

export type PlayerMessage = { kind: "xapi"; statement: XapiStatement } | { kind: "size"; height: number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const finiteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

/**
 * A message of the player frame, or null. The sandboxed frame has an opaque origin, so the origin must be the
 * string "null" and the source the frame's own window; the payload is rebuilt field by field (strict schema,
 * bounded numbers), never passed on as it came.
 */
export function parsePlayerMessage(
  event: { source: unknown; origin: string; data: unknown },
  frameWindow: unknown,
): PlayerMessage | null {
  if (!frameWindow || event.source !== frameWindow || event.origin !== "null") return null
  const data = event.data
  if (!isRecord(data)) return null
  if (data.type === H5P_SIZE_MESSAGE) {
    const height = data.height
    return finiteNumber(height) && height > 0 && height <= MAX_HEIGHT ? { kind: "size", height } : null
  }
  if (data.type !== H5P_XAPI_MESSAGE) return null
  const verb = data.verb
  if (verb !== XAPI_COMPLETED && verb !== XAPI_ANSWERED) return null
  const score = data.score
  if (!isRecord(score)) return null
  const { raw, max } = score
  if (!finiteNumber(raw) || !finiteNumber(max) || raw < 0 || max <= 0 || raw > max || max > 1_000_000) return null
  if (typeof data.completion !== "boolean") return null
  return {
    kind: "xapi",
    statement: { verb: { id: verb }, result: { score: { raw, max }, completion: data.completion } },
  }
}
