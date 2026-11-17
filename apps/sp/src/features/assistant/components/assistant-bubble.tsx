"use client"

import { ApiError, getAiChatQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { AssistantChatPane, useCreateChat } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, buttonVariants, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

/** The chat the bubble continues, per user on this device. */
export function bubbleChatKey(userId: string): string {
  return `ihsp:sp:assistant-bubble:chat:${userId}`
}

function readChatId(userId: string): string | null {
  if (!userId) return null
  try {
    return window.localStorage.getItem(bubbleChatKey(userId))
  } catch {
    return null
  }
}

function writeChatId(userId: string, id: string | null): void {
  if (!userId) return
  try {
    if (id) window.localStorage.setItem(bubbleChatKey(userId), id)
    else window.localStorage.removeItem(bubbleChatKey(userId))
  } catch {
    // Storage blocked: the chat is kept for this page only.
  }
}

/** The on-screen keyboard takes this much of the layout viewport (phones, the Telegram webview). */
const KEYBOARD_GAP = 150

/** Input types that never raise the on-screen keyboard. */
const NON_TEXT_INPUTS: Record<string, true> = {
  button: true,
  checkbox: true,
  radio: true,
  range: true,
  submit: true,
  reset: true,
  file: true,
  color: true,
  image: true,
}

function isEditable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.isContentEditable || element instanceof HTMLTextAreaElement) return true
  return element instanceof HTMLInputElement && !NON_TEXT_INPUTS[element.type]
}

/** True while the on-screen keyboard is up; the collapsed circle then hides so it does not cover the field. */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () =>
      setOpen(
        Math.abs(viewport.scale - 1) < 0.01 &&
          isEditable(document.activeElement) &&
          window.innerHeight - viewport.height > KEYBOARD_GAP,
      )
    viewport.addEventListener("resize", update)
    document.addEventListener("focusin", update)
    document.addEventListener("focusout", update)
    return () => {
      viewport.removeEventListener("resize", update)
      document.removeEventListener("focusin", update)
      document.removeEventListener("focusout", update)
    }
  }, [])
  return open
}

const BOTTOM =
  "bottom-[calc(var(--bottom-nav-height,0px)+var(--safe-bottom,0px)+1rem)] md:bottom-[calc(var(--safe-bottom,0px)+1rem)]"

/**
 * The assistant of the student app as a floating circle above the phone bottom bar (the bottom corner on wider
 * screens). A click grows the circle into a chat card as wide as the bottom bar (24 rem from 768 px) with the real
 * assistant chat. Collapsing keeps the chat: the next opening continues it, "New chat" starts another one and the
 * expand link opens it on the assistant page. The chat id is kept per user in this device's storage. Hidden on the
 * assistant page and, collapsed, while the on-screen keyboard is up.
 */
export function AssistantBubble() {
  const t = useT("assistantBubble")
  const pathname = usePathname()
  const { session } = useSession()
  const userId = session?.user.id ?? ""
  const [open, setOpen] = useState(false)
  const [chatId, setChatIdState] = useState<string | null>(() => readChatId(userId))
  const keyboardOpen = useKeyboardOpen()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const wasOpen = useRef(false)
  const create = useCreateChat("student")
  const chat = useQuery({ ...getAiChatQuery(chatId ?? ""), enabled: open && chatId !== null })

  const setChatId = useCallback(
    (id: string | null) => {
      setChatIdState(id)
      writeChatId(userId, id)
    },
    [userId],
  )

  // The user id arrives after the first render on a cold start: pick up that user's chat then.
  useEffect(() => {
    if (userId) setChatIdState(readChatId(userId))
  }, [userId])

  const startChat = create.mutate
  const start = useCallback(
    () => startChat(undefined, { onSuccess: (created) => setChatId(created.id) }),
    [setChatId, startChat],
  )

  // A kept chat that no longer exists (deleted on the assistant page) is forgotten and the creation state reset, so
  // a fresh one starts below even when this bubble already created a chat earlier.
  const resetCreate = create.reset
  useEffect(() => {
    if (chat.error instanceof ApiError && chat.error.status === 404) {
      resetCreate()
      setChatId(null)
    }
  }, [chat.error, resetCreate, setChatId])

  // Opening without a chat starts one, once; a failure waits for "Try again".
  useEffect(() => {
    if (open && chatId === null && create.isIdle) start()
  }, [open, chatId, create.isIdle, start])

  // Focus moves into the card on opening and back to the circle on collapsing.
  useEffect(() => {
    if (open) panel.current?.focus()
    else if (wasOpen.current) trigger.current?.focus()
    wasOpen.current = open
  }, [open])

  // Escape collapses the open card, unless something inside (a menu, a dialog) already handled it.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (!panel.current?.contains(document.activeElement)) return
      setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  if (pathname.startsWith("/assistant")) return null
  if (!open && keyboardOpen) return null

  const collapse = () => setOpen(false)
  const newChat = () => {
    create.reset()
    start()
  }

  return (
    <div
      key={open ? "open" : "closed"}
      // The onboarding gate hides the floating widgets (`[data-help-widget]`) until the first steps are done.
      data-help-widget
      className={cn(
        "fixed z-40 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-safe:ease-out",
        BOTTOM,
        open
          ? "bg-popover text-popover-foreground rounded-card end-3 h-[min(36rem,calc(100dvh-var(--bottom-nav-height,0px)-var(--safe-bottom,0px)-var(--safe-top,0px)-6rem))] w-[calc(100vw-1.5rem)] origin-bottom-right overflow-hidden border motion-safe:zoom-in-90 motion-safe:slide-in-from-bottom-6 md:end-4 md:h-[min(36rem,calc(100dvh-var(--safe-bottom,0px)-var(--safe-top,0px)-6rem))] md:w-[24rem]"
          : "end-4 size-12 origin-bottom-right rounded-full motion-safe:zoom-in-50",
      )}
    >
      {open ? (
        <section
          ref={panel}
          id="assistant-bubble-panel"
          role="dialog"
          aria-label={t("title")}
          tabIndex={-1}
          className="motion-safe:animate-in motion-safe:fade-in-0 flex h-full flex-col outline-none motion-safe:duration-300 motion-reduce:animate-none"
        >
          <header className="flex items-center gap-1 border-b px-2 py-1">
            <Icons.assistant aria-hidden className="text-primary ms-1 size-4 shrink-0" />
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{t("title")}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 md:size-8"
              onClick={newChat}
              disabled={create.isPending}
            >
              <Icons.edit aria-hidden />
              <span className="sr-only">{t("newChat")}</span>
            </Button>
            {chatId ? (
              <Link
                href={`/assistant/chat/?id=${chatId}`}
                onClick={collapse}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "size-11 md:size-8" })}
              >
                <Icons.externalLink aria-hidden />
                <span className="sr-only">{t("openFull")}</span>
              </Link>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 md:size-8"
              aria-expanded
              aria-controls="assistant-bubble-panel"
              onClick={collapse}
            >
              <Icons.chevronDown aria-hidden />
              <span className="sr-only">{t("collapse")}</span>
            </Button>
          </header>
          {create.isError ? (
            <div role="alert" className="flex flex-col items-start gap-2 p-3 text-sm">
              <p>{t("error")}</p>
              <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={newChat}>
                {t("retry")}
              </Button>
            </div>
          ) : chatId && !create.isPending ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <AssistantChatPane
                key={chatId}
                chatId={chatId}
                basePath="/assistant"
                navButtons={null}
                bare
                placeholder={t("placeholder")}
                empty={
                  <div className="flex flex-col gap-1 p-3 text-sm">
                    <p className="font-medium">{t("emptyTitle")}</p>
                    <p className="text-muted-foreground">{t("emptyBody")}</p>
                  </div>
                }
              />
            </div>
          ) : (
            <div role="status" aria-label={t("starting")} className="flex flex-col gap-2 p-3">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-9 w-full" />
            </div>
          )}
        </section>
      ) : (
        <Button
          ref={trigger}
          type="button"
          size="icon"
          className="size-12 rounded-full"
          aria-expanded={false}
          aria-controls="assistant-bubble-panel"
          onClick={() => setOpen(true)}
        >
          <Icons.assistant aria-hidden />
          <span className="sr-only">{t("open")}</span>
        </Button>
      )}
    </div>
  )
}
