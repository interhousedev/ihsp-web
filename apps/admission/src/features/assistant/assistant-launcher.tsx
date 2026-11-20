"use client"

import { useSession } from "@ihsp/auth"
import { AssistantChatPane, AssistantEntry, AssistantProvider, TierPicker } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AssistantConsentCard } from "./consent-card"
import { useDockChat } from "./dock-chat"
import { McpPanel } from "./mcp-panel"
import { McpPrompt } from "./mcp-prompt"
import { ASSISTANT_PREFILL_EVENT } from "../home/components/start-here-card"

const SUGGESTIONS = ["1", "2", "3", "4"] as const

/**
 * The chat popup of every applicant page, opened by the AI button of the header (`AssistantHeaderButton`): about half
 * the page on wide screens, a bottom sheet on phones. It stays mounted after the first open and is shown and hidden with
 * transform and opacity only, so the conversation survives route changes and closing. Only students get it.
 */
/** The header's AI button asks the dock to open with this window event. */
export const ASSISTANT_OPEN_EVENT = "admission:assistant-open"

/** The AI button of the header (students only): opens the dock of `AssistantLauncher`. */
export function AssistantHeaderButton() {
  const { session } = useSession()
  const onAssistantPage = usePathname().startsWith("/assistant")
  if (!session?.user.roles?.includes("student") || onAssistantPage) return null
  return <AssistantEntry onClick={() => window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT))} />
}

export function AssistantLauncher() {
  const { session } = useSession()
  const onAssistantPage = usePathname().startsWith("/assistant")
  if (!session?.user.roles?.includes("student") || onAssistantPage) return null
  return <AssistantDock userId={session.user.id} />
}

function AssistantDock({ userId }: { userId: string }) {
  const t = useT("assistantDock")
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [prefill, setPrefill] = useState<{ key: number; text: string } | null>(null)
  const [view, setView] = useState<"chat" | "mcp">("chat")
  const chat = useDockChat(userId, opened)
  const returnFocus = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      returnFocus.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    const onPrefill = (event: Event) => {
      const text = (event as CustomEvent<{ text?: string }>).detail?.text
      if (!text) return
      setView("chat")
      setOpened(true)
      setOpen(true)
      setPrefill({ key: Date.now(), text })
    }
    window.addEventListener(ASSISTANT_PREFILL_EVENT, onPrefill)
    return () => window.removeEventListener(ASSISTANT_PREFILL_EVENT, onPrefill)
  }, [])

  useEffect(() => {
    const onOpen = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpened(true)
      setOpen(true)
    }
    window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("textarea")?.focus(), 220)
    return () => window.clearTimeout(id)
  }, [open, view, chat.chatId])

  return (
    <AssistantProvider assistant="admission">
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
            <Link
              href="/assistant/"
              aria-label={t("openFull")}
              title={t("openFull")}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 md:size-9")}
              onClick={() => setOpen(false)}
            >
              <Icons.externalLink className="size-4" aria-hidden />
            </Link>
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
                returnFocus.current?.focus()
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
                  consentCard={({ retry }) => <AssistantConsentCard retry={retry} />}
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
