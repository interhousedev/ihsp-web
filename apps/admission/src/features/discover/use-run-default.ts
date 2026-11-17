"use client"

import { ApiError, keys, readAiChatStream, type AdmissionUniChat } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale } from "@ihsp/i18n"
import { streamRunDefault } from "./api"
import { uniChatKey } from "./hooks"

export type RunState = { status: "idle" } | { status: "running"; text: string } | { status: "error"; error: unknown }

const IDLE: RunState = { status: "idle" }
const isStream = (response: Response) => (response.headers.get("content-type") ?? "").includes("text/event-stream")

/**
 * Runs the student's default prompt in the chat of a university. `auto` runs claim the one-off first run on the server
 * (204 afterwards); the hook starts it by itself once per opening when the server says it is pending, and `run(false)`
 * is the manual "Run research" button for universities seen before.
 */
export function useRunDefault(chat: AdmissionUniChat | undefined) {
  const client = useQueryClient()
  const locale = useLocale()
  const [runs, setRuns] = useState<Record<string, RunState>>({})
  const started = useRef(new Set<string>())
  const chatId = chat?.chat_id
  const institutionId = chat?.institution_id

  const run = useCallback(
    async (auto: boolean) => {
      if (!institutionId || !chatId) return
      // A run goes on in the background when the student swipes on; its state belongs to its university.
      const setState = (next: RunState | ((current: RunState) => RunState)) =>
        setRuns((all) => ({
          ...all,
          [institutionId]: typeof next === "function" ? next(all[institutionId] ?? IDLE) : next,
        }))
      setState({ status: "running", text: "" })
      try {
        const response = await streamRunDefault(institutionId, auto, locale)
        if (isStream(response)) {
          for await (const event of readAiChatStream(response)) {
            if (event.event === "delta")
              setState((s) => (s.status === "running" ? { ...s, text: s.text + event.data.text } : s))
            else if (event.event === "round_end") setState({ status: "running", text: "" })
            else if (event.event === "error")
              // Keep the problem type (a limit, revoked access) so the panel can say why the run stopped.
              throw new ApiError({
                type: event.data.type ?? "",
                status: 0,
                title: event.data.title ?? "Research failed",
                message_key: event.data.message_key,
                params: event.data.params,
              })
          }
        }
        setState({ status: "idle" })
      } catch (error) {
        setState({ status: "error", error })
      } finally {
        // The server claims the one-off run up front, so it is spent on failure too; this re-enables "Run research".
        client.setQueryData<AdmissionUniChat>(uniChatKey(institutionId), (current) =>
          current ? { ...current, auto_run_pending: false } : current,
        )
        void client.invalidateQueries({ queryKey: keys.ai.chat(chatId) })
      }
    },
    [chatId, institutionId, client, locale],
  )

  const pending = chat?.auto_run_pending === true
  useEffect(() => {
    if (!pending || !institutionId || started.current.has(institutionId)) return
    started.current.add(institutionId)
    void run(true)
  }, [pending, institutionId, run])

  const state = (institutionId ? runs[institutionId] : undefined) ?? IDLE
  return { state, run }
}
