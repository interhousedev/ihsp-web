"use client"

import { getLibraryMarkup, putLibraryMarkup, type MarkupShape } from "@ihsp/api"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import {
  canRedo,
  canUndo,
  initialHistory,
  isDirty,
  markupReducer,
  parseMarkup,
  serializeMarkup,
  shapeCount,
  type Pages,
} from "./lib/markup"

// The drawings of the PDF reader. They are kept per user and item on the server (`/me/library/markup/{item_id}`) and
// saved on request. In temporary mode (and for visitors) nothing is sent: the drawings live in memory and are lost
// when the reader closes. `dirty` is what a closing reader must ask about.

const NO_PAGES: Pages = {}

export function useReaderMarkup({ itemId, fileId, signedIn }: { itemId: string; fileId: string; signedIn: boolean }) {
  const [history, dispatch] = useReducer(markupReducer, undefined, () => initialHistory())
  const [saved, setSaved] = useState<Pages>(NO_PAGES)
  const [temporary, setTemporary] = useState(!signedIn)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const touched = useRef(false)
  const pages = history.present
  const canPersist = signedIn

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    getLibraryMarkup(itemId)
      .then((doc) => {
        if (cancelled || touched.current || (doc.file_id !== null && doc.file_id !== fileId)) return
        const loaded = parseMarkup(doc.pages)
        setSaved(loaded)
        dispatch({ type: "load", pages: loaded })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [itemId, fileId, signedIn])

  const act = useCallback((action: Parameters<typeof dispatch>[0]) => {
    touched.current = true
    dispatch(action)
  }, [])

  const add = useCallback((page: number, shape: MarkupShape) => act({ type: "add", page, shape }), [act])
  const erase = useCallback((page: number, id: string) => act({ type: "erase", page, id }), [act])
  const undo = useCallback(() => act({ type: "undo" }), [act])
  const redo = useCallback(() => act({ type: "redo" }), [act])
  const clear = useCallback(() => act({ type: "clear" }), [act])

  /** Drawings made in temporary mode count as unsaved as long as they exist; in saved mode only changes do. */
  const dirty = temporary ? isDirty(pages, saved) || shapeCount(pages) > 0 : isDirty(pages, saved)
  const unsaved = canPersist && isDirty(pages, saved)

  const save = useCallback(async (): Promise<boolean> => {
    if (!canPersist) return false
    setSaving(true)
    setFailed(false)
    try {
      await putLibraryMarkup(itemId, { file_id: fileId, pages: serializeMarkup(pages) })
      setSaved(pages)
      setTemporary(false)
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setSaving(false)
    }
  }, [canPersist, itemId, fileId, pages])

  /** Back to what was saved (nothing in temporary mode with no saved drawings). */
  const discard = useCallback(() => act({ type: "load", pages: saved }), [act, saved])

  return {
    pages,
    temporary: temporary || !canPersist,
    setTemporary,
    canPersist,
    dirty,
    unsaved,
    saving,
    failed,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    add,
    erase,
    undo,
    redo,
    clear,
    save,
    discard,
  }
}

export type ReaderMarkup = ReturnType<typeof useReaderMarkup>
