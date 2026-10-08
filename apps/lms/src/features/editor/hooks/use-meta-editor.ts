"use client"

import { getLmsCourseDraftQuery, isApiError, isNetworkError, type CourseDraft } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { bufferKey, clearBuffer, readBuffer, writeBuffer, type Buffered } from "../utils/local-buffer"
import { AUTOSAVE_INTERVAL_MS, type SaveStatus } from "../utils/save-status"
import { useAutosave, useWarnBeforeUnload } from "./use-autosave"
import { useDraftActions } from "./use-course-draft"

type Meta = { title: string; description: string }
type Phase = "idle" | "saving" | "offline" | "error" | "conflict"

/**
 * The title and description of the course draft: local edits, Save, autosave every 30 seconds, the offline buffer and
 * the conflict choice (Keep mine / Take theirs). Outline operations are saved at once and do not go through here.
 */
export function useMetaEditor(
  draft: CourseDraft,
  { canEdit, autosaveMs = AUTOSAVE_INTERVAL_MS }: { canEdit: boolean; autosaveMs?: number },
) {
  const queryClient = useQueryClient()
  const actions = useDraftActions(draft.id)
  const key = bufferKey.course(draft.id)

  const [title, setTitle] = useState(draft.title)
  const [description, setDescription] = useState(draft.description)
  const [synced, setSynced] = useState<Meta>({ title: draft.title, description: draft.description })
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<unknown>(null)
  const [restorable, setRestorable] = useState<Buffered<Meta> | null>(() => {
    const stored = readBuffer<Meta>(key)
    return stored && (stored.value.title !== draft.title || stored.value.description !== draft.description)
      ? stored
      : null
  })

  const dirty = title !== synced.title || description !== synced.description
  const latest = useRef({ title, description, dirty, phase })
  useEffect(() => {
    latest.current = { title, description, dirty, phase }
  })
  const saving = useRef(false)

  // A change made by someone else shows up here when there are no local edits to lose.
  useEffect(() => {
    if (latest.current.dirty) return
    setTitle(draft.title)
    setDescription(draft.description)
    setSynced({ title: draft.title, description: draft.description })
  }, [draft.title, draft.description])

  // Mirror unsaved edits to the offline buffer; keep an old buffer until the user decided about it.
  useEffect(() => {
    if (restorable) return
    if (dirty) writeBuffer<Meta>(key, { title, description })
    else clearBuffer(key)
  }, [dirty, title, description, key, restorable])

  const save = useCallback(async () => {
    if (!canEdit || !latest.current.dirty || saving.current) return
    saving.current = true
    const sent: Meta = { title: latest.current.title, description: latest.current.description }
    setPhase("saving")
    setError(null)
    try {
      await actions.meta.mutateAsync(sent)
      setSynced(sent)
      setPhase("idle")
    } catch (caught) {
      setError(caught)
      if (isApiError(caught) && caught.type === "common/conflict") setPhase("conflict")
      else setPhase(isNetworkError(caught) ? "offline" : "error")
    } finally {
      saving.current = false
    }
  }, [actions.meta, canEdit])

  useAutosave({
    intervalMs: autosaveMs,
    enabled: canEdit,
    onTick: () => {
      if (latest.current.phase !== "conflict") void save()
    },
  })
  useWarnBeforeUnload(dirty)

  const keepMine = useCallback(async () => {
    await queryClient.fetchQuery({ ...getLmsCourseDraftQuery(draft.id), staleTime: 0 })
    setPhase("idle")
    await save()
  }, [draft.id, queryClient, save])

  const takeTheirs = useCallback(async () => {
    const fresh = await queryClient.fetchQuery({ ...getLmsCourseDraftQuery(draft.id), staleTime: 0 })
    setTitle(fresh.title)
    setDescription(fresh.description)
    setSynced({ title: fresh.title, description: fresh.description })
    setPhase("idle")
  }, [draft.id, queryClient])

  const restore = useCallback(() => {
    if (!restorable) return
    setTitle(restorable.value.title)
    setDescription(restorable.value.description)
    setRestorable(null)
  }, [restorable])

  const discardBuffer = useCallback(() => {
    clearBuffer(key)
    setRestorable(null)
  }, [key])

  const status: SaveStatus = phase !== "idle" ? (phase === "saving" ? "saving" : phase) : dirty ? "dirty" : "saved"

  return {
    title,
    setTitle,
    description,
    setDescription,
    dirty,
    status,
    error,
    save,
    keepMine,
    takeTheirs,
    restorable,
    restore,
    discardBuffer,
    busy: phase === "saving",
  }
}
