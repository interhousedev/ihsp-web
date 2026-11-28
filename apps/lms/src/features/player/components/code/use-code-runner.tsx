"use client"

import type { CodeLanguage } from "@ihsp/api"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  CODE_RUNNER_PAGE,
  CODE_RUNNER_SANDBOX,
  appendOutput,
  parseRunnerMessage,
  runRequest,
  type RunResult,
  type RunnerTest,
} from "../../utils/code-runner"

export type RunPhase = "idle" | "loading" | "running" | "done"

export type RunState = {
  phase: RunPhase
  stdout: string
  stderr: string
  truncated: boolean
  result: RunResult | null
}

const IDLE: RunState = { phase: "idle", stdout: "", stderr: "", truncated: false, result: null }

const CANCELLED: RunResult = { error: "cancelled", timedOut: false, truncated: false, tests: [] }

/**
 * The sandboxed runner frame of one code block. The frame is created on the first run (Python downloads ~12 MB once)
 * and kept while the block is shown; `run` resolves with the result of that run.
 */
export function useCodeRunner(title: string) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<RunState>(IDLE)
  const ready = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null)
  const pending = useRef<{ id: string; resolve: (result: RunResult) => void } | null>(null)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = parseRunnerMessage(event, frameRef.current?.contentWindow)
      if (!message) return
      if (message.kind === "hello") {
        ready.current?.resolve()
        return
      }
      const run = pending.current
      if (!run || run.id !== message.id) return
      if (message.kind === "status") {
        setState((current) => ({ ...current, phase: message.status }))
      } else if (message.kind === "output") {
        setState((current) => {
          const isOut = message.stream === "stdout"
          const next = appendOutput(isOut ? current.stdout : current.stderr, message.text)
          const truncated = current.truncated || next.truncated
          return isOut ? { ...current, stdout: next.text, truncated } : { ...current, stderr: next.text, truncated }
        })
      } else {
        const result = {
          error: message.error,
          timedOut: message.timedOut,
          truncated: message.truncated,
          tests: message.tests,
        }
        pending.current = null
        setState((current) => ({ ...current, phase: "done", truncated: current.truncated || result.truncated, result }))
        run.resolve(result)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const run = useCallback(
    async (language: CodeLanguage, code: string, tests: RunnerTest[], timeLimitMs: number): Promise<RunResult> => {
      if (!ready.current) {
        ready.current = Promise.withResolvers<void>()
        setMounted(true)
      }
      setState({ ...IDLE, phase: "loading" })
      await ready.current.promise
      const id = crypto.randomUUID()
      const request = runRequest(id, language, code, tests, timeLimitMs)
      const { promise, resolve } = Promise.withResolvers<RunResult>()
      // A newer run (or Reset) supersedes the previous one: settle it so no caller waits forever.
      pending.current?.resolve(CANCELLED)
      pending.current = { id, resolve }
      // The frame has an opaque origin, so it cannot be addressed by origin; only this frame window receives it.
      frameRef.current?.contentWindow?.postMessage(request, "*")
      return promise
    },
    [],
  )

  const reset = useCallback(() => {
    pending.current?.resolve(CANCELLED)
    pending.current = null
    setState(IDLE)
  }, [])

  const frame = mounted ? (
    <iframe
      ref={frameRef}
      src={CODE_RUNNER_PAGE}
      sandbox={CODE_RUNNER_SANDBOX}
      title={title}
      referrerPolicy="no-referrer"
      className="hidden"
      data-code-runner
    />
  ) : null

  return { state, run, reset, frame }
}
