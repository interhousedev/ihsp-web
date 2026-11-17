"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"

const keyFor = (userId: string | undefined) => `admission.discover.explainer.${userId ?? "anonymous"}`

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}

/** First visit only: a ghost card swipes left (skip) and right (interested). Dismissal is kept per user. */
export function SwipeExplainer() {
  const t = useT("discover")
  const { session } = useSession()
  const userId = session?.user.id
  const key = keyFor(userId)
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const ghost = useRef<HTMLDivElement>(null)

  // Wait for the signed-in user, so the flag is never stored under the anonymous key.
  useEffect(() => setDismissed(userId ? read(key) : null), [key, userId])

  useEffect(() => {
    const node = ghost.current
    if (dismissed !== false || !node || typeof node.animate !== "function") return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const animation = node.animate(
      [
        { transform: "translateX(0) rotate(0)", opacity: 1, offset: 0 },
        { transform: "translateX(-4.5rem) rotate(-10deg)", opacity: 0.5, offset: 0.25 },
        { transform: "translateX(0) rotate(0)", opacity: 1, offset: 0.5 },
        { transform: "translateX(4.5rem) rotate(10deg)", opacity: 0.5, offset: 0.75 },
        { transform: "translateX(0) rotate(0)", opacity: 1, offset: 1 },
      ],
      { duration: 4000, iterations: Infinity, easing: "ease-in-out" },
    )
    return () => {
      // `finished` rejects when the animation is cancelled; that is expected here.
      animation.finished.catch(() => undefined)
      animation.cancel()
    }
  }, [dismissed])

  if (dismissed !== false) return null

  function dismiss() {
    try {
      window.localStorage.setItem(key, "1")
    } catch {
      // Private mode: the explainer just reappears next visit.
    }
    setDismissed(true)
  }

  return (
    <section
      aria-label={t("explainer.title")}
      className="bg-card border-hairline-strong rounded-card relative flex flex-col gap-3 overflow-hidden border p-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center gap-2" aria-hidden>
          <Icons.thumbDown className="text-muted-foreground size-4" />
          <div ref={ghost} className="bg-muted border-hairline-strong h-16 w-12 rounded-lg border border-dashed" />
          <Icons.heart className="text-success size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("explainer.title")}</p>
          <p className="text-muted-foreground text-sm">{t("explainer.text")}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" className="self-end" onClick={dismiss}>
        {t("explainer.dismiss")}
      </Button>
    </section>
  )
}
