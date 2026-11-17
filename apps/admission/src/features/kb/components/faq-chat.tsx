"use client"

import { AssistantChatPane, AssistantProvider, useCreateChat } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { AiTabCard } from "../../../components/ai-tab-card"

/** The admission assistant on the FAQ page: the same backend as the popup; links to articles open in the reader. */
export function FaqChat() {
  const t = useT("kb")
  const router = useRouter()
  const create = useCreateChat("admission")
  const [chatId, setChatId] = useState<string | null>(null)
  const started = useRef(false)

  const start = () => create.mutate(undefined, { onSuccess: (chat) => setChatId(chat.id) })
  useEffect(() => {
    if (started.current) return
    started.current = true
    start()
    // One chat per visit; "New chat" starts another.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Citations are plain markdown links to /faq/?id=…: keep them inside the single-page export.
  const openCitation = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    const anchor = (event.target as HTMLElement).closest("a")
    const href = anchor?.getAttribute("href")
    if (!href?.startsWith("/faq")) return
    event.preventDefault()
    router.push(href)
  }

  return (
    <AiTabCard
      label={t("chatTab")}
      icon={<Icons.sparkles aria-hidden />}
      className="min-h-[28rem] flex-1"
      data-testid="faq-chat"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-end"
        disabled={create.isPending}
        onClick={() => {
          setChatId(null)
          start()
        }}
      >
        <Icons.add aria-hidden />
        {t("newChat")}
      </Button>
      {create.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>{t("chatFailed")}</p>
          <Button type="button" variant="outline" size="sm" onClick={start}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {!chatId && !create.isError ? <Skeleton className="h-64 w-full" /> : null}
      {chatId ? (
        // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="flex h-[min(36rem,calc(100dvh-22rem-var(--safe-bottom,0px)))] md:h-[min(36rem,calc(100dvh-14rem))] min-h-0 flex-col"
          onClick={openCitation}
        >
          <AssistantProvider assistant="admission">
            <AssistantChatPane
              key={chatId}
              chatId={chatId}
              basePath="/faq"
              navButtons={null}
              bare
              placeholder={t("chatPlaceholder")}
              emptyText={t("chatEmpty")}
            />
          </AssistantProvider>
        </div>
      ) : null}
    </AiTabCard>
  )
}
