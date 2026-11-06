type Entry = { handler: () => void; fallback: boolean }

/**
 * Who answers Telegram's one back button. A page's handler (its back link) wins over the shell's fallback; effects of
 * children run before their parents', so the order of mounting cannot decide this.
 */
export function createBackStack() {
  const entries: Entry[] = []
  return {
    add(handler: () => void, fallback: boolean): () => void {
      const entry = { handler, fallback }
      entries.push(entry)
      return () => {
        entries.splice(entries.indexOf(entry), 1)
      }
    },
    current(): (() => void) | undefined {
      const pages = entries.filter((entry) => !entry.fallback)
      return (pages[pages.length - 1] ?? entries[entries.length - 1])?.handler
    },
  }
}
