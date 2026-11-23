import { describe, expect, test } from "bun:test"
import {
  CODE_MESSAGE,
  CODE_RUNNER_SANDBOX,
  OUTPUT_CAP,
  appendOutput,
  parseRunnerMessage,
  runRequest,
  scoreOf,
} from "../features/player/utils/code-runner"

const frame = {} as Window
const other = {} as Window
const event = (data: unknown, origin = "null", source: unknown = frame) =>
  ({ data, origin, source }) as Pick<MessageEvent, "data" | "origin" | "source">

describe("parseRunnerMessage", () => {
  test("accepts the frame's messages from the opaque origin", () => {
    expect(parseRunnerMessage(event({ type: CODE_MESSAGE, kind: "hello" }), frame)).toEqual({ kind: "hello" })
    expect(
      parseRunnerMessage(event({ type: CODE_MESSAGE, kind: "output", id: "r", stream: "stdout", text: "hi" }), frame),
    ).toEqual({ kind: "output", id: "r", stream: "stdout", text: "hi" })
    const result = parseRunnerMessage(
      event({
        type: CODE_MESSAGE,
        kind: "result",
        id: "r",
        error: null,
        timedOut: false,
        truncated: false,
        tests: [{ id: "t", passed: true, message: "", extra: "dropped" }],
        injected: "<script>",
      }),
      frame,
    )
    expect(result).toEqual({
      kind: "result",
      id: "r",
      error: null,
      timedOut: false,
      truncated: false,
      tests: [{ id: "t", passed: true, message: "" }],
    })
  })

  test("rejects another source, a real origin or a missing frame", () => {
    const hello = { type: CODE_MESSAGE, kind: "hello" }
    expect(parseRunnerMessage(event(hello, "null", other), frame)).toBeNull()
    expect(parseRunnerMessage(event(hello, "https://lms.example"), frame)).toBeNull()
    expect(parseRunnerMessage(event(hello, "https://evil.example"), frame)).toBeNull()
    expect(parseRunnerMessage(event(hello), null)).toBeNull()
  })

  test("rejects malformed messages", () => {
    const bad = [
      null,
      "string",
      [],
      { type: "other", kind: "hello" },
      { type: CODE_MESSAGE, kind: "unknown", id: "r" },
      { type: CODE_MESSAGE, kind: "status", id: "r", status: "pwned" },
      { type: CODE_MESSAGE, kind: "output", id: "", stream: "stdout", text: "" },
      { type: CODE_MESSAGE, kind: "output", id: "r", stream: "stdin", text: "" },
      { type: CODE_MESSAGE, kind: "output", id: "r", stream: "stdout", text: "x".repeat(OUTPUT_CAP + 1) },
      { type: CODE_MESSAGE, kind: "result", id: "r", tests: "all" },
      { type: CODE_MESSAGE, kind: "result", id: "r", tests: [{ id: "t", passed: "yes" }] },
      { type: CODE_MESSAGE, kind: "result", id: "x".repeat(65), tests: [] },
    ]
    for (const data of bad) expect(parseRunnerMessage(event(data), frame)).toBeNull()
  })
})

describe("run requests and scores", () => {
  test("the sandbox is scripts only", () => {
    expect(CODE_RUNNER_SANDBOX).toBe("allow-scripts")
  })

  test("drops empty tests and clamps the time limit", () => {
    const request = runRequest(
      "r",
      "python",
      "x = 1",
      [
        { id: "a", name: "A", code: "assert x" },
        { id: "b", name: "B", code: "  " },
      ],
      90_000,
    )
    expect(request.tests.map((test) => test.id)).toEqual(["a"])
    expect(request.timeLimitMs).toBe(30_000)
    expect(runRequest("r", "sql", "", [], 10).timeLimitMs).toBe(1000)
  })

  test("caps the output", () => {
    const first = appendOutput("", "a".repeat(OUTPUT_CAP - 2))
    expect(first.truncated).toBe(false)
    const second = appendOutput(first.text, "bbbb")
    expect(second.truncated).toBe(true)
    expect(second.text.length).toBe(OUTPUT_CAP)
  })

  test("scores the share of passing tests; a timeout scores 0", () => {
    const tests = [
      { id: "a", passed: true, message: "" },
      { id: "b", passed: false, message: "" },
    ]
    const base = { error: null, timedOut: false, truncated: false, tests }
    expect(scoreOf(base, ["a", "b"])).toEqual({ scorePct: 50, passed: false })
    expect(scoreOf(base, ["a"])).toEqual({ scorePct: 100, passed: true })
    expect(scoreOf({ ...base, timedOut: true }, ["a"])).toEqual({ scorePct: 0, passed: false })
    expect(scoreOf({ ...base, tests: [] }, [])).toEqual({ scorePct: 100, passed: true })
    expect(scoreOf({ ...base, error: "boom", tests: [] }, [])).toEqual({ scorePct: 0, passed: false })
  })
})
