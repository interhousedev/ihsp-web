"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useEffect, useState } from "react"

const DISMISS_KEY = "ihsp:admission:assistant:mcp-prompt-dismissed"

/** A dismissible card that offers to connect an external AI tool; the choice is remembered on this device. */
export function McpPrompt({ onConnect }: { onConnect: () => void }) {
  const t = useT("assistantDock.prompt")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1")
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // Storage blocked: the card returns on the next visit.
    }
  }

  return (
    <div
      className="bg-muted/50 mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-card border px-3 py-1 [@media(max-height:34rem)]:hidden"
      data-testid="mcp-prompt"
    >
      <Icons.connectors className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 py-1 text-xs leading-snug" title={t("text")}>
        {t("label")}
      </p>
      <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-8" onClick={onConnect}>
        {t("connect")}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-8" onClick={dismiss}>
        {t("dismiss")}
      </Button>
    </div>
  )
}
