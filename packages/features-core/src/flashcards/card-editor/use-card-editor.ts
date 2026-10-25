"use client"

import { useCallback, useMemo, useState } from "react"
import {
  filledRows,
  incompleteRowKeys,
  insertImported,
  moveRow,
  moveRowTo,
  newEditorRow,
  rowsEqual,
  tooLongRowKeys,
  type EditorRow,
} from "../utils/editor-rows"
import { CARD_TEXT_MAX, DESCRIPTION_MAX, MAX_CARDS_PER_SET, TITLE_MAX } from "../utils/limits"
import type { ImportedCard } from "../utils/parse-import"

export type CardEditorProblem = "titleRequired" | "titleTooLong" | "descriptionTooLong" | "cardsRequired" | "tooMany"

export type CardEditorInitial = { title: string; description: string; rows: EditorRow[] }

/** The state of the card editor: the fields, the rows with their order, what is wrong and whether anything changed. */
export function useCardEditor(initial: CardEditorInitial, mode: "create" | "edit") {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [rows, setRows] = useState<EditorRow[]>(() =>
    initial.rows.length > 0 ? initial.rows : mode === "create" ? [newEditorRow(), newEditorRow()] : [newEditorRow()],
  )
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const update = useCallback((key: string, patch: Partial<Pick<EditorRow, "front" | "back">>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }, [])
  const remove = useCallback((key: string) => setRows((current) => current.filter((row) => row.key !== key)), [])
  const move = useCallback((index: number, delta: -1 | 1) => setRows((current) => moveRow(current, index, delta)), [])
  const moveByKey = useCallback((from: string, to: string) => {
    setRows((current) =>
      moveRowTo(
        current,
        current.findIndex((row) => row.key === from),
        current.findIndex((row) => row.key === to),
      ),
    )
  }, [])
  const addRow = useCallback(() => {
    const row = newEditorRow()
    setRows((current) => [...current, row])
    setFocusKey(row.key)
  }, [])
  const importCards = useCallback((cards: ImportedCard[], afterKey?: string) => {
    setRows((current) => insertImported(current, cards, afterKey))
  }, [])

  const filled = useMemo(() => filledRows(rows), [rows])
  const incomplete = useMemo(() => incompleteRowKeys(rows), [rows])
  const tooLong = useMemo(() => tooLongRowKeys(rows, CARD_TEXT_MAX), [rows])
  const dirty =
    title !== initial.title || description !== initial.description || !rowsEqual(filled, filledRows(initial.rows))

  const problems: CardEditorProblem[] = []
  if (title.trim() === "") problems.push("titleRequired")
  if (title.trim().length > TITLE_MAX) problems.push("titleTooLong")
  if (description.trim().length > DESCRIPTION_MAX) problems.push("descriptionTooLong")
  if (mode === "create" && filled.length === 0) problems.push("cardsRequired")
  if (filled.length > MAX_CARDS_PER_SET) problems.push("tooMany")
  const valid = problems.length === 0 && incomplete.size === 0 && tooLong.size === 0

  return {
    title,
    setTitle,
    description,
    setDescription,
    rows,
    update,
    remove,
    move,
    moveByKey,
    addRow,
    importCards,
    focusKey,
    showErrors,
    setShowErrors,
    incomplete,
    tooLong,
    problems,
    valid,
    dirty,
    canAdd: rows.length < MAX_CARDS_PER_SET,
  }
}
