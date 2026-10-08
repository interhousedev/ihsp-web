"use client"

import {
  getConflictTheirs,
  getLmsStepDraftQuery,
  isApiError,
  isNetworkError,
  keys,
  putLmsStepDraft,
  type StepContent,
  type StepDraft,
} from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAutosave, useWarnBeforeUnload } from "../../editor/hooks/use-autosave"
import { bufferKey, clearBuffer, readBuffer, writeBuffer, type Buffered } from "../../editor/utils/local-buffer"
import { AUTOSAVE_INTERVAL_MS, type SaveStatus } from "../../editor/utils/save-status"
import { jsonEqual } from "../../shared/utils/block-diff"
import { remapIds } from "../utils/content-ops"

type Phase = "idle" | "saving" | "offline" | "error" | "conflict"

/**
 * The working copy of a step draft: edits, Save and autosave (30 s), the optimistic-lock version, the conflict with
 * another editor (Keep mine / Take theirs, LMS-13), the offline buffer and the keys that keep inputs mounted while the
 * server swaps placeholder ids for real ones.
 */
export function useStepEditor(
  draft: StepDraft,
  { canEdit, autosaveMs = AUTOSAVE_INTERVAL_MS }: { canEdit: boolean; autosaveMs?: number },
) {
  const stepId = draft.step_id
  const queryClient = useQueryClient()
  const key = bufferKey.step(stepId)

  const [content, setContent] = useState<StepContent>(draft.content)
  const [dirty, setDirty] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<unknown>(null)
  const [conflict, setConflict] = useState<StepDraft | null>(null)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [restorable, setRestorable] = useState<Buffered<StepContent> | null>(() => {
    const stored = readBuffer<StepContent>(key)
    return stored && !jsonEqual(stored.value, draft.content) ? stored : null
  })

  const contentRef = useRef(content)
  const lockRef = useRef(draft.lock_version)
  const dirtyRef = useRef(false)
  const editCount = useRef(0)
  const saving = useRef(false)
  const phaseRef = useRef<Phase>("idle")
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  const uids = useRef(new Map<string, string>())
  const nextUid = useRef(0)

  const keyOf = useCallback((id: string) => {
    let uid = uids.current.get(id)
    if (!uid) {
      nextUid.current += 1
      uid = `k${nextUid.current}`
      uids.current.set(id, uid)
    }
    return uid
  }, [])

  const edit = useCallback((update: (current: StepContent) => StepContent) => {
    contentRef.current = update(contentRef.current)
    editCount.current += 1
    dirtyRef.current = true
    setContent(contentRef.current)
    setDirty(true)
  }, [])

  // Mirror unsaved edits to the offline buffer; keep an old buffer until the user decided about it.
  useEffect(() => {
    if (restorable) return
    if (dirty) writeBuffer<StepContent>(key, content)
    else clearBuffer(key)
  }, [dirty, content, key, restorable])

  const save = useCallback(async () => {
    if (!canEdit || !dirtyRef.current || saving.current) return
    saving.current = true
    const sent = contentRef.current
    const sentCount = editCount.current
    setPhase("saving")
    setError(null)
    try {
      const saved = await putLmsStepDraft(stepId, { content: sent, lock_version: lockRef.current })
      lockRef.current = saved.lock_version
      const unchanged = editCount.current === sentCount
      const remapped = remapIds(contentRef.current, sent, saved.content)
      for (const [from, to] of remapped.aliases) uids.current.set(to, keyOf(from))
      contentRef.current = unchanged ? saved.content : remapped.content
      setContent(contentRef.current)
      dirtyRef.current = !unchanged
      setDirty(!unchanged)
      setPhase("idle")
      queryClient.setQueryData(keys.lms.stepDraft(stepId), saved)
      void queryClient.invalidateQueries({ queryKey: keys.lms.draft(saved.course_id) })
      void queryClient.invalidateQueries({ queryKey: keys.lms.pending(saved.course_id) })
    } catch (caught) {
      setError(caught)
      const theirs = getConflictTheirs<StepDraft>(caught)
      if (theirs || (isApiError(caught) && caught.type === "common/conflict")) {
        const other = theirs ?? (await queryClient.fetchQuery({ ...getLmsStepDraftQuery(stepId), staleTime: 0 }))
        if (other) setConflict(other)
        setConflictOpen(true)
        setPhase("conflict")
      } else {
        setPhase(isNetworkError(caught) ? "offline" : "error")
      }
    } finally {
      saving.current = false
    }
  }, [canEdit, keyOf, queryClient, stepId])

  useAutosave({
    intervalMs: autosaveMs,
    enabled: canEdit,
    onTick: () => {
      if (phaseRef.current !== "conflict") void save()
    },
  })
  useWarnBeforeUnload(dirty)

  /** Replaces the working copy with a draft from the server (discard, restore, take theirs). */
  const replaceFromServer = useCallback(
    (next: StepDraft) => {
      contentRef.current = next.content
      lockRef.current = next.lock_version
      dirtyRef.current = false
      setContent(next.content)
      setDirty(false)
      setPhase("idle")
      setError(null)
      setConflict(null)
      setConflictOpen(false)
      setRestorable(null)
      clearBuffer(key)
      queryClient.setQueryData(keys.lms.stepDraft(stepId), next)
      void queryClient.invalidateQueries({ queryKey: keys.lms.draft(next.course_id) })
      void queryClient.invalidateQueries({ queryKey: keys.lms.pending(next.course_id) })
    },
    [key, queryClient, stepId],
  )

  const keepMine = useCallback(async () => {
    if (!conflict) return
    lockRef.current = conflict.lock_version
    setConflict(null)
    setConflictOpen(false)
    setPhase("idle")
    await save()
  }, [conflict, save])

  const takeTheirs = useCallback(() => {
    if (conflict) replaceFromServer(conflict)
  }, [conflict, replaceFromServer])

  const restore = useCallback(() => {
    if (!restorable) return
    edit(() => restorable.value)
    setRestorable(null)
  }, [edit, restorable])

  const discardBuffer = useCallback(() => {
    clearBuffer(key)
    setRestorable(null)
  }, [key])

  const status: SaveStatus = phase === "idle" ? (dirty ? "dirty" : "saved") : phase

  return {
    content,
    edit,
    dirty,
    status,
    error,
    save,
    keyOf,
    conflict,
    conflictOpen,
    openConflict: () => setConflictOpen(true),
    closeConflict: () => setConflictOpen(false),
    keepMine,
    takeTheirs,
    replaceFromServer,
    restorable,
    restore,
    discardBuffer,
    busy: phase === "saving",
  }
}

export type StepEditorState = ReturnType<typeof useStepEditor>
