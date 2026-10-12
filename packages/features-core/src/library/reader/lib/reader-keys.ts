// Keyboard shortcuts of the reader: arrows and page keys, `/` search in
// the item, `g` go to page, `h` highlight, `n` note, `b` bookmark, `+` and `-` zoom, `Esc` closes panels.

export type ReaderKeyAction =
  | "next"
  | "prev"
  | "first"
  | "last"
  | "search"
  | "goto"
  | "highlight"
  | "note"
  | "bookmark"
  | "zoom-in"
  | "zoom-out"
  | "escape"

type KeyLike = Pick<KeyboardEvent, "key" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey">

/** The action for a key press, or `null` when the reader does not use it (modifier shortcuts belong to the browser). */
export function keyAction(event: KeyLike): ReaderKeyAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  switch (event.key) {
    case "ArrowRight":
    case "PageDown":
      return "next"
    case "ArrowLeft":
    case "PageUp":
      return "prev"
    case " ":
      return event.shiftKey ? "prev" : "next"
    case "Home":
      return "first"
    case "End":
      return "last"
    case "/":
      return "search"
    case "g":
    case "G":
      return "goto"
    case "h":
    case "H":
      return "highlight"
    case "n":
    case "N":
      return "note"
    case "b":
    case "B":
      return "bookmark"
    case "+":
    case "=":
      return "zoom-in"
    case "-":
    case "_":
      return "zoom-out"
    case "Escape":
      return "escape"
    default:
      return null
  }
}

const TYPING = "input, textarea, select, [contenteditable=''], [contenteditable='true']"

/**
 * True when the key press belongs to something else: a text field, a dialog, a menu or a slider. `Escape` is never
 * taken from an open dialog (the dialog closes itself).
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.matches(TYPING) || !!target.closest("[role='dialog'], [role='menu'], [role='listbox'], [role='slider']")
}
