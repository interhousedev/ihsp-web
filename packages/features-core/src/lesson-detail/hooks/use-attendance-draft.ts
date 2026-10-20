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
import { pruneDrafts, type WorkOffDraft, type WorkOffDrafts } from "../utils/work-offs"

type Draft = {
  /** What the teacher sees now. */
  marks: Marks
  /** What the sheet of `baseVersion` says; the draft is dirty when `marks` differs from it. */
  baseMarks: Marks
  baseVersion: number
  /** Work-off choices of students marked absent in this form; students not listed keep their saved work-off. */
  workOffs: WorkOffDrafts
}

function fromSheet(sheet: AttendanceSheet): Draft {
  const marks = initialMarks(sheet)
  return { marks, baseMarks: marks, baseVersion: sheet.version, workOffs: {} }
}

function isDirty(draft: Draft): boolean {
  return !sameMarks(draft.marks, draft.baseMarks) || Object.keys(draft.workOffs).length > 0
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
      if (isDirty(current)) return current
      return fromSheet(sheet)
    })
  }, [sheet])

  const dirty = isDirty(draft)
  const stale = draft.baseVersion !== sheet.version && dirty

  const mark = useCallback(
    (userId: string, next: AttendanceMark) =>
      setDraft((current) => {
        const marks = setMark(current.marks, userId, next)
        return { ...current, marks, workOffs: pruneDrafts(current.workOffs, marks) }
      }),
    [],
  )
  const setUnassigned = useCallback(
    (userId: string, next: AttendanceMark) =>
      setDraft((current) => {
        const marks = setUnassignedMark(current.marks, userId, next)
        return { ...current, marks, workOffs: pruneDrafts(current.workOffs, marks) }
      }),
    [],
  )
  /** Sets the work-off choice of an absent student. */
  const setWorkOff = useCallback(
    (userId: string, choice: WorkOffDraft) =>
      setDraft((current) => ({ ...current, workOffs: { ...current.workOffs, [userId]: choice } })),
    [],
  )
  const markEveryonePresent = useCallback(
    () => setDraft((current) => ({ ...current, marks: everyonePresent(current.marks, sheet), workOffs: {} })),
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
    workOffs: draft.workOffs,
    baseVersion: draft.baseVersion,
    dirty,
    stale,
    mark,
    setUnassigned,
    setWorkOff,
    markEveryonePresent,
    reset,
    rebase,
  }
}
