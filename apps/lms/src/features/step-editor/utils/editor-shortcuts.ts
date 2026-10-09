import type { InlineFormat } from "./markdown/markdown-index"
import type { Shortcut } from "./shortcut-label"

export type ShortcutAction = InlineFormat | "link" | "equation"

/** The editor's keyboard shortcuts (⌘ on Apple devices, Ctrl elsewhere). */
export const EDITOR_SHORTCUTS: readonly { action: ShortcutAction; shortcut: Shortcut }[] = [
  { action: "bold", shortcut: { key: "b" } },
  { action: "italic", shortcut: { key: "i" } },
  { action: "underline", shortcut: { key: "u" } },
  { action: "strike", shortcut: { key: "x", shift: true } },
  { action: "code", shortcut: { key: "e" } },
  { action: "spoiler", shortcut: { key: "p", shift: true } },
  { action: "link", shortcut: { key: "k" } },
  { action: "equation", shortcut: { key: "m" } },
]

export function shortcutOf(action: ShortcutAction): Shortcut | undefined {
  return EDITOR_SHORTCUTS.find((entry) => entry.action === action)?.shortcut
}
