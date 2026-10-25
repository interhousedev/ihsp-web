import type { FlashcardCardsBody, FlashcardSetDetail } from "@ihsp/api"
import type { ImportedCard } from "./parse-import"

/** One card in the editor. `id` is missing for cards that are not saved yet. */
export type EditorRow = { key: string; id?: string; front: string; back: string }

let newRowCounter = 0

export function newEditorRow(front = "", back = ""): EditorRow {
  newRowCounter += 1
  return { key: `new-${newRowCounter}`, front, back }
}

export function rowsFromSet(set: Pick<FlashcardSetDetail, "cards">): EditorRow[] {
  return set.cards
    .toSorted((a, b) => a.position - b.position)
    .map((card) => ({ key: card.id, id: card.id, front: card.front, back: card.back }))
}

function isBlank(row: EditorRow): boolean {
  return row.front.trim() === "" && row.back.trim() === ""
}

/** Moves a row to another index; out-of-range moves return the same rows. */
export function moveRowTo(rows: EditorRow[], from: number, to: number): EditorRow[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows
  const next = [...rows]
  const [moved] = next.splice(from, 1)
  if (!moved) return rows
  next.splice(to, 0, moved)
  return next
}

/** Moves a row by `delta` places (Alt plus an arrow key on its handle). */
export function moveRow(rows: EditorRow[], index: number, delta: -1 | 1): EditorRow[] {
  return moveRowTo(rows, index, index + delta)
}

/** Rows that are not completely blank: the editor keeps spare empty rows, the backend never sees them. */
export function filledRows(rows: EditorRow[]): EditorRow[] {
  return rows.filter((row) => !isBlank(row))
}

/** The full ordered list the backend expects; cards that are missing from it are deleted (WEB-24). */
export function toCardsBody(rows: EditorRow[]): FlashcardCardsBody {
  return {
    cards: filledRows(rows).map((row) =>
      row.id
        ? { id: row.id, front: row.front.trim(), back: row.back.trim() }
        : { front: row.front.trim(), back: row.back.trim() },
    ),
  }
}

/** Keys of rows where only one side is filled; a card needs both sides. */
export function incompleteRowKeys(rows: EditorRow[]): Set<string> {
  return new Set(
    rows.filter((row) => !isBlank(row) && (row.front.trim() === "" || row.back.trim() === "")).map((row) => row.key),
  )
}

/** Keys of rows with a side longer than the backend accepts. */
export function tooLongRowKeys(rows: EditorRow[], max: number): Set<string> {
  return new Set(rows.filter((row) => row.front.length > max || row.back.length > max).map((row) => row.key))
}

/**
 * Adds imported cards after the row `afterKey`. A blank row where the paste happened is used up first, so pasting
 * into an empty editor does not leave empty rows behind. Without `afterKey` the cards go to the end and the spare
 * blank rows are dropped.
 */
export function insertImported(rows: EditorRow[], imported: ImportedCard[], afterKey?: string): EditorRow[] {
  if (imported.length === 0) return rows
  const added = imported.map((card) => newEditorRow(card.front, card.back))
  const at = afterKey ? rows.findIndex((row) => row.key === afterKey) : -1
  if (at < 0) return [...rows.filter((row) => !isBlank(row)), ...added]
  const anchor = at >= 0 ? rows[at] : undefined
  if (anchor && isBlank(anchor)) return [...rows.slice(0, at), ...added, ...rows.slice(at + 1)]
  return [...rows.slice(0, at + 1), ...added, ...rows.slice(at + 1)]
}

export function rowsEqual(a: EditorRow[], b: EditorRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((row, index) => {
      const other = b[index]
      return other !== undefined && row.id === other.id && row.front === other.front && row.back === other.back
    })
  )
}
