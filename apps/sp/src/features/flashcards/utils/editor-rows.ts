import type { FlashcardCardsBody, FlashcardSetDetail } from "@ihsp/api"

/** One card in the editor. `id` is missing for cards that are not saved yet. */
export type EditorRow = { key: string; id?: string; front: string; back: string }

let newRowCounter = 0

export function newEditorRow(): EditorRow {
  newRowCounter += 1
  return { key: `new-${newRowCounter}`, front: "", back: "" }
}

export function rowsFromSet(set: FlashcardSetDetail): EditorRow[] {
  return set.cards
    .toSorted((a, b) => a.position - b.position)
    .map((card) => ({ key: card.id, id: card.id, front: card.front, back: card.back }))
}

/** Moves a row by `delta` places; out-of-range moves return the same rows. */
export function moveRow(rows: EditorRow[], index: number, delta: -1 | 1): EditorRow[] {
  const target = index + delta
  if (index < 0 || index >= rows.length || target < 0 || target >= rows.length) return rows
  const next = [...rows]
  const [moved] = next.splice(index, 1)
  if (!moved) return rows
  next.splice(target, 0, moved)
  return next
}

/** The full ordered list the backend expects; cards that are missing from it are deleted (WEB-24). */
export function toCardsBody(rows: EditorRow[]): FlashcardCardsBody {
  return {
    cards: rows.map((row) =>
      row.id
        ? { id: row.id, front: row.front.trim(), back: row.back.trim() }
        : { front: row.front.trim(), back: row.back.trim() },
    ),
  }
}

/** Keys of rows where one side is empty; a card needs both sides. */
export function incompleteRowKeys(rows: EditorRow[]): Set<string> {
  return new Set(rows.filter((row) => row.front.trim() === "" || row.back.trim() === "").map((row) => row.key))
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
