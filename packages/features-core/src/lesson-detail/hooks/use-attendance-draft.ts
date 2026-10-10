"use client"

import type { AttendanceSheet } from "@ihsp/api"
import { useCallback, useEffect, useState } from "react"
import {
  everyonePresent,
  initialMarks,
  sameMarks,
  setMark,
  setUnassignedMark,
  type AttendanceMark,
  type Marks,
} from "../utils/marks"

type Draft = {
  /** What the teacher sees now. */
  marks: Marks
  /** What the sheet of `baseVersion` says; the draft is dirty when `marks` differs from it. */
  baseMarks: Marks
  baseVersion: number
}

function fromSheet(sheet: AttendanceSheet): Draft {
  const marks = initialMarks(sheet)
  return { marks, baseMarks: marks, baseVersion: sheet.version }
}

/**
 * The marks of the attendance form. A sheet that changed on the server is taken over when the teacher has no
 * unsaved edits; with edits the form keeps them and reports `stale`, and a save then ends in the conflict dialog.
 */
export function useAttendanceDraft(sheet: AttendanceSheet) {
  const [draft, setDraft] = useState<Draft>(() => fromSheet(sheet))

  useEffect(() => {
    setDraft((current) => {
      if (current.baseVersion === sheet.version) return current
      if (!sameMarks(current.marks, current.baseMarks)) return current
      return fromSheet(sheet)
    })
  }, [sheet])

  const dirty = !sameMarks(draft.marks, draft.baseMarks)
  const stale = draft.baseVersion !== sheet.version && dirty

  const mark = useCallback(
    (userId: string, next: AttendanceMark) =>
      setDraft((current) => ({ ...current, marks: setMark(current.marks, userId, next) })),
    [],
  )
  const setUnassigned = useCallback(
    (userId: string, next: AttendanceMark) =>
      setDraft((current) => ({ ...current, marks: setUnassignedMark(current.marks, userId, next) })),
    [],
  )
  const markEveryonePresent = useCallback(
    () => setDraft((current) => ({ ...current, marks: everyonePresent(current.marks, sheet) })),
    [sheet],
  )
  /** Drops the edits and shows `next` (the "review the current list" choice of the conflict dialog). */
  const reset = useCallback((next: AttendanceSheet) => setDraft(fromSheet(next)), [])
  /** Keeps the edits on top of `next`: the next save is checked against its version. */
  const rebase = useCallback(
    (next: AttendanceSheet) =>
      setDraft((current) => ({ ...current, baseMarks: initialMarks(next), baseVersion: next.version })),
    [],
  )

  return {
    marks: draft.marks,
    baseVersion: draft.baseVersion,
    dirty,
    stale,
    mark,
    setUnassigned,
    markEveryonePresent,
    reset,
    rebase,
  }
}
