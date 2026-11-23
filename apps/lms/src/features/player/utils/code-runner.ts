import type { CodeLanguage } from "@ihsp/api"

/**
 * The code runner frame (apps/lms/public/code-runner/runner.{html,js}): learner code runs in Web Workers inside an
 * iframe with exactly this sandbox (scripts only, opaque origin), never on the server and never in the LMS page.
 */
export const CODE_RUNNER_PAGE = "/code-runner/runner.html"
export const CODE_RUNNER_SANDBOX = "allow-scripts"
export const CODE_MESSAGE = "ihsp-code"
/** Output kept per run (the frame caps at the same size). */
export const OUTPUT_CAP = 64 * 1024
const MAX_TESTS = 30
const MAX_MESSAGE = 4_000

export type RunnerTest = { id: string; name: string; code: string }

export type RunRequest = {
  type: typeof CODE_MESSAGE
  kind: "run"
  id: string
  language: CodeLanguage
  code: string
  tests: RunnerTest[]
  timeLimitMs: number
}

export type TestOutcome = { id: string; passed: boolean; message: string }

export type RunResult = {
  error: string | null
  timedOut: boolean
  truncated: boolean
  tests: TestOutcome[]
}

export type RunnerMessage =
  | { kind: "hello" }
  | { kind: "status"; id: string; status: "loading" | "running" }
  | { kind: "output"; id: string; stream: "stdout" | "stderr"; text: string }
  | ({ kind: "result"; id: string } & RunResult)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const shortString = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max

/** The run message for the frame; the time limit is clamped to what the block allows (1..30 s). */
export function runRequest(
  id: string,
  language: CodeLanguage,
  code: string,
  tests: RunnerTest[],
  timeLimitMs: number,
): RunRequest {
  return {
    type: CODE_MESSAGE,
    kind: "run",
    id,
    language,
    code,
    tests: tests.filter((test) => test.code.trim() !== "").slice(0, MAX_TESTS),
    timeLimitMs: Math.min(30_000, Math.max(1000, Math.round(timeLimitMs))),
  }
}

/**
 * A message of the runner frame, rebuilt field by field, or null. Only messages whose source is our frame and whose
 * origin is "null" (the opaque origin of the sandbox) count: another frame or window cannot forge a result.
 */
export function parseRunnerMessage(
  event: Pick<MessageEvent, "data" | "origin" | "source">,
  frame: Window | null | undefined,
): RunnerMessage | null {
  if (!frame || event.source !== frame || event.origin !== "null") return null
  const data = event.data
  if (!isRecord(data) || data.type !== CODE_MESSAGE) return null
  if (data.kind === "hello") return { kind: "hello" }
  if (!shortString(data.id, 64) || data.id === "") return null
  const id = data.id
  switch (data.kind) {
    case "status":
      return data.status === "loading" || data.status === "running" ? { kind: "status", id, status: data.status } : null
    case "output":
      if ((data.stream !== "stdout" && data.stream !== "stderr") || !shortString(data.text, OUTPUT_CAP)) return null
      return { kind: "output", id, stream: data.stream, text: data.text }
    case "result": {
      if (!Array.isArray(data.tests) || data.tests.length > MAX_TESTS) return null
      const tests: TestOutcome[] = []
      for (const test of data.tests) {
        if (!isRecord(test) || !shortString(test.id, 64) || typeof test.passed !== "boolean") return null
        tests.push({
          id: test.id,
          passed: test.passed,
          message: shortString(test.message, MAX_MESSAGE) ? test.message : "",
        })
      }
      const error = data.error === null ? null : shortString(data.error, MAX_MESSAGE) ? data.error : null
      return {
        kind: "result",
        id,
        error,
        timedOut: data.timedOut === true,
        truncated: data.truncated === true,
        tests,
      }
    }
    default:
      return null
  }
}

/** Appends output up to the cap; `truncated` turns true once something was dropped. */
export function appendOutput(current: string, text: string): { text: string; truncated: boolean } {
  const room = OUTPUT_CAP - current.length
  if (text.length <= room) return { text: current + text, truncated: false }
  return { text: current + text.slice(0, Math.max(0, room)), truncated: true }
}

/**
 * The score of a run over the tests it was asked to run: the share of passing tests; without tests, a clean run is
 * 100. A timeout or a crash scores 0.
 */
export function scoreOf(result: RunResult, testIds: string[]): { scorePct: number; passed: boolean } {
  if (result.timedOut) return { scorePct: 0, passed: false }
  if (testIds.length === 0) {
    const clean = result.error === null
    return { scorePct: clean ? 100 : 0, passed: clean }
  }
  const passing = new Set(result.tests.filter((test) => test.passed).map((test) => test.id))
  const count = testIds.filter((id) => passing.has(id)).length
  const scorePct = Math.round((count / testIds.length) * 10_000) / 100
  return { scorePct, passed: count === testIds.length }
}
