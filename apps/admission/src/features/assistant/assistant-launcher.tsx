"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { AssistantPanel } from "./assistant-panel"

/**
 * Floating button at the bottom right of every applicant page. It opens the chat as a bottom sheet on phones and a
 * docked panel on wide screens. Only people with the student role see it.
 */
export function AssistantLauncher() {
  const t = useT("assistant")
  const { session } = useSession()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])
  if (!session?.user.roles?.includes("student")) return null
  return (
    <>
      {!open ? (
        <button
          type="button"
          aria-label={t("open")}
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full shadow-lg motion-safe:transition-transform motion-safe:hover:scale-105 md:right-6 md:bottom-6"
        >
          <Icons.sparkles aria-hidden className="size-6" />
        </button>
      ) : null}
      {open ? (
        <aside
          role="dialog"
          aria-label={t("title")}
          className={`animate-in fade-in-0 slide-in-from-bottom-8 duration-200 md:slide-in-from-right-8 motion-reduce:animate-none bg-background fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border shadow-2xl md:inset-x-auto md:top-0 md:right-0 md:h-dvh md:w-[420px] md:rounded-none md:border-y-0 md:border-r-0`}
        >
          <AssistantPanel onClose={() => setOpen(false)} />
        </aside>
      ) : null}
    </>
  )
}
