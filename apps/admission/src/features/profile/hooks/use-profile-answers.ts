"use client"

import { isApiError } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { fetchProfile, PROFILE_KEY, putProfile } from "../api"
import type { AnswerValue, Answers, Profile } from "../types"

export type SaveState = "idle" | "saving" | "saved" | "error"

const AUTOSAVE_DELAY_MS = 700

function isConflict(error: unknown): boolean {
  return isApiError(error) && (error.type === "admission/conflict" || error.status === 409)
}

/**
 * The student's answers with autosave. Changes are sent in order (one request at a time, each with the
 * `lock_version` of the last response). On a 409 the profile is read again, the server's answers become the base,
 * the unsaved edits are laid over them and the save is retried once. A failed save keeps the edits and shows
 * "not saved"; `retry` sends them again.
 */
export function useProfileAnswers(initial: Profile) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Answers>(initial.answers)
  const [state, setState] = useState<SaveState>("idle")
  const [profile, setProfile] = useState<Profile>(initial)
  const lock = useRef(initial.lock_version)
  const pending = useRef<Answers>({})
  const queue = useRef<Promise<void>>(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const send = useCallback(async (batch: Answers): Promise<Profile> => {
    try {
      return await putProfile(batch, lock.current)
    } catch (error) {
      if (!isConflict(error)) throw error
      const fresh = await fetchProfile()
      lock.current = fresh.lock_version
      setAnswers({ ...fresh.answers, ...batch, ...pending.current })
      return putProfile(batch, fresh.lock_version)
    }
  }, [])

  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current ?? undefined)
    timer.current = null
    queue.current = queue.current.then(async () => {
      const batch = pending.current
      if (Object.keys(batch).length === 0) return
      pending.current = {}
      setState("saving")
      try {
        const saved = await send(batch)
        lock.current = saved.lock_version
        setProfile(saved)
        queryClient.setQueryData(PROFILE_KEY, saved)
        setState(Object.keys(pending.current).length > 0 ? "saving" : "saved")
      } catch {
        pending.current = { ...batch, ...pending.current }
        setState("error")
      }
    })
    return queue.current
  }, [queryClient, send])

  const setAnswer = useCallback(
    (id: string, value: AnswerValue) => {
      setAnswers((current) => ({ ...current, [id]: value }))
      pending.current = { ...pending.current, [id]: value }
      setState("saving")
      clearTimeout(timer.current ?? undefined)
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS)
    },
    [flush],
  )

  useEffect(
    () => () => {
      clearTimeout(timer.current ?? undefined)
      if (Object.keys(pending.current).length > 0) void flush()
    },
    [flush],
  )

  return { answers, profile, state, setAnswer, flush, retry: flush }
}
