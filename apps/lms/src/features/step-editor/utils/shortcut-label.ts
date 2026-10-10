/** A keyboard shortcut of the editor: `mod` is ⌘ on Apple devices and Ctrl elsewhere. */
export interface Shortcut {
  key: string
  shift?: boolean
}

function isApple(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

/** How the shortcut is written on this device: `⌘⇧X` or `Ctrl+Shift+X`. */
export function shortcutLabel(shortcut: Shortcut): string {
  const key = shortcut.key.toUpperCase()
  if (isApple()) return `⌘${shortcut.shift ? "⇧" : ""}${key}`
  return `Ctrl+${shortcut.shift ? "Shift+" : ""}${key}`
}

/** The shortcut for `aria-keyshortcuts`: `Meta+Shift+X` or `Control+Shift+X`. */
export function shortcutAria(shortcut: Shortcut): string {
  return `${isApple() ? "Meta" : "Control"}+${shortcut.shift ? "Shift+" : ""}${shortcut.key.toUpperCase()}`
}

/**
 * Whether a key press is the shortcut: ⌘ or Ctrl without Alt (so AltGr letters keep working). The physical key counts
 * too, so shortcuts work with Cyrillic keyboard layouts (Ctrl+B types "и" there).
 */
export function matchesShortcut(
  event: {
    key: string
    code: string
    metaKey: boolean
    ctrlKey: boolean
    altKey: boolean
    shiftKey: boolean
  },
  shortcut: Shortcut,
): boolean {
  if (event.altKey || !(event.metaKey || event.ctrlKey) || event.shiftKey !== Boolean(shortcut.shift)) return false
  return event.key.toLowerCase() === shortcut.key || event.code === `Key${shortcut.key.toUpperCase()}`
}
