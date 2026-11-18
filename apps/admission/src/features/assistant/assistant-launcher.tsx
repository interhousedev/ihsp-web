"use client"

import { useSession } from "@ihsp/auth"
import { AssistantChatPane, AssistantProvider, TierPicker } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, cn } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { useDockChat } from "./dock-chat"
import { McpPanel } from "./mcp-panel"
import { McpPrompt } from "./mcp-prompt"
import { usePathname } from "next/navigation"
import { tourKey, useTourOpen } from "../steps"

const SUGGESTIONS = ["1", "2", "3", "4"] as const

/**
 * Floating button at the bottom right of every applicant page. It opens a rectangular chat popup (about half the page
 * on wide screens, a bottom sheet on phones). The popup stays mounted after the first open and is shown and hidden with
 * transform and opacity only, so the conversation survives route changes and closing. Only students see it.
 */
export function AssistantLauncher() {
  const { session } = useSession()
  if (!session?.user.roles?.includes("student")) return null
  return <AssistantDock userId={session.user.id} />
}

function AssistantDock({ userId }: { userId: string }) {
  const t = useT("assistantDock")
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [prefill, setPrefill] = useState<{ key: number; text: string } | null>(null)
  const [view, setView] = useState<"chat" | "mcp">("chat")
  const chat = useDockChat(userId, opened)
  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const path = usePathname()
  const tourOpen = useTourOpen(tourKey(userId))
  const hideLauncher = tourOpen || path.startsWith("/faq")

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      launcher.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function show() {
    setOpened(true)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("textarea")?.focus(), 220)
    return () => window.clearTimeout(id)
  }, [open, view, chat.chatId])

  return (
    <AssistantProvider assistant="admission">
      <button
        ref={launcher}
        type="button"
        aria-label={t("open")}
        aria-expanded={open}
        tabIndex={open ? -1 : 0}
        onClick={show}
        className={cn(
          "bg-primary text-primary-foreground fixed right-4 bottom-20 z-40 flex size-14 origin-bottom-right items-center justify-center rounded-full shadow-lg md:right-6 md:bottom-6",
          "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:hover:scale-105",
          open && "pointer-events-none scale-50 opacity-0",
          hideLauncher && "hidden",
        )}
      >
        <Icons.sparkles aria-hidden className="size-6" />
      </button>
      {opened ? (
        <aside
          role="dialog"
          aria-label={t("title")}
          aria-hidden={!open}
          inert={!open}
          data-open={open}
          ref={panel}
          className={cn(
            "bg-background fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] origin-bottom-right flex-col overflow-hidden rounded-t-2xl border shadow-2xl",
            "md:inset-x-auto md:right-6 md:bottom-6 md:h-[70dvh] md:max-h-[44rem] md:min-h-[26rem] md:w-[28rem] md:rounded-card",
            "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-out",
            open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-6 scale-95 opacity-0",
          )}
        >
          <header className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{t("title")}</h2>
            <TierPicker value={chat.tier} onChange={chat.restart} disabled={chat.chatId === null} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 md:size-9"
              aria-label={t("newChat")}
              onClick={() => {
                setView("chat")
                chat.restart(chat.tier)
              }}
            >
              <Icons.add className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 md:size-9"
              aria-label={t("mcp.open")}
              aria-pressed={view === "mcp"}
              onClick={() => setView(view === "mcp" ? "chat" : "mcp")}
            >
              <Icons.connectors className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 md:size-9"
              aria-label={t("close")}
              onClick={() => {
                setOpen(false)
                launcher.current?.focus()
              }}
            >
              <Icons.close className="size-4" aria-hidden />
            </Button>
          </header>
          {view === "mcp" ? (
            <McpPanel onBack={() => setView("chat")} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <McpPrompt onConnect={() => setView("mcp")} />
              {chat.chatId ? (
                <AssistantChatPane
                  key={chat.chatId}
                  chatId={chat.chatId}
                  basePath="/"
                  navButtons={null}
                  bare
                  placeholder={t("placeholder")}
                  emptyText={t("emptyText")}
                  prefill={prefill}
                  empty={
                    <div
                      className="mx-auto flex w-full max-w-sm flex-col gap-2 px-4 pb-4"
                      data-testid="dock-suggestions"
                    >
                      <p className="text-muted-foreground text-xs font-medium">{t("suggestionsLabel")}</p>
                      {SUGGESTIONS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="hover:bg-muted min-h-11 rounded-card border px-3 py-2 text-start text-sm"
                          onClick={() => setPrefill({ key: Date.now(), text: t(`suggestions.${id}`) })}
                        >
                          {t(`suggestions.${id}`)}
                        </button>
                      ))}
                    </div>
                  }
                />
              ) : chat.failed ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm">{t("error")}</p>
                  <Button type="button" variant="outline" className="min-h-11" onClick={chat.retry}>
                    {t("retry")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-3 p-4" aria-busy>
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-10 w-1/2 self-end" />
                </div>
              )}
            </div>
          )}
        </aside>
      ) : null}
    </AssistantProvider>
  )
}
