"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconQuote } from "@tabler/icons-react"
import type { TextSelection } from "./use-text-selection"

const TOOLBAR_HALF_WIDTH = 80

/** A small floating "Ask about this" button above the selected text. */
export function SelectionToolbar({ selection, onAsk }: { selection: TextSelection; onAsk: () => void }) {
  const t = useT("notebooks")
  if (!selection.rect) return null
  const center = selection.rect.left + selection.rect.width / 2
  const left = Math.min(Math.max(center, TOOLBAR_HALF_WIDTH), window.innerWidth - TOOLBAR_HALF_WIDTH)
  const top = Math.max(8, selection.rect.top - 52)
  return (
    <div
      role="group"
      aria-label={t("viewer.ask")}
      style={{ top, left }}
      className="bg-popover text-popover-foreground fixed z-50 -translate-x-1/2 rounded-lg border p-1 shadow-md"
    >
      <Button
        type="button"
        size="sm"
        className="min-h-11 gap-1 px-3 md:min-h-8"
        // Pressing the button must not clear the selection it is about.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onAsk}
      >
        <IconQuote aria-hidden />
        {t("viewer.ask")}
      </Button>
    </div>
  )
}
