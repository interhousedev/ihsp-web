"use client"

import { isApiError, type AdmissionMatch as Match } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { AssistantChatPane, AssistantProvider } from "@ihsp/features-core"
import { Button, buttonVariants, Icons, Markdown, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { AiTabCard } from "../../../components/ai-tab-card"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { DefaultPromptDialog } from "./default-prompt-dialog"
import { useUniChat, useUniChatSuggestions } from "../hooks"
import { useRunDefault } from "../use-run-default"

/** The university the panel talks about: a deck match, or an entry of the list. */
export type ChatSubject = Pick<Match, "university_id" | "name" | "logo_url" | "city">

/** The per-university AI chat on the side of the deck: persisted per student and university, with research and chips. */
export function UniChatPanel({ match }: { match: ChatSubject | undefined }) {
  const t = useT("uniChat")
  const errorMessage = useErrorMessage()
  const [promptOpen, setPromptOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ key: number; text: string } | null>(null)
  const id = match?.university_id
  const chat = useUniChat(id)
  const suggestions = useUniChatSuggestions(id)
  const { state, run } = useRunDefault(chat.data)
  const running = state.status === "running" || chat.data?.auto_run_pending === true

  /** The panel's line for a limit, the problem's own copy (revoked access), or the generic failure. */
  const runErrorText = (error: unknown) => {
    if (!isApiError(error)) return t("runFailed")
    const limit = LIMIT_KEYS[error.type]
    if (limit) return t(`limits.${limit}`)
    const text = errorMessage(error)
    return text && text !== errorMessage(null) ? text : t("runFailed")
  }

  if (!match) return <p className="text-muted-foreground text-sm">{t("empty")}</p>

  const chips = suggestions.data?.questions ?? []
  const chipsLimited = isApiError(suggestions.error) && LIMIT_KEYS[suggestions.error.type] !== undefined
  const above = (
    <div className="flex flex-col items-center gap-2">
      {chipsLimited ? (
        <p role="status" className="text-muted-foreground text-xs" data-testid="uni-chat-chips-limited">
          {t("limits.chips")}
        </p>
      ) : null}
      {chips.length > 0 ? (
        <ul className="flex w-full gap-2 overflow-x-auto pb-1" aria-label={t("chips")}>
          {chips.map((chip) => (
            <li key={chip} className="shrink-0">
              <button
                type="button"
                onClick={() => setPrefill((current) => ({ key: (current?.key ?? 0) + 1, text: chip }))}
                className="hover:bg-accent rounded-full border px-3 py-1.5 text-start text-xs"
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 rounded-full"
        aria-label={t("editPrompt")}
        title={t("editPrompt")}
        onClick={() => setPromptOpen(true)}
      >
        <Icons.add aria-hidden />
      </Button>
    </div>
  )

  return (
    <AiTabCard label={t("tab")} icon={<Icons.sparkles aria-hidden />} data-testid="uni-chat" className="gap-4">
      <div className="flex items-center gap-3">
        <LogoAvatar name={match.name} src={match.logo_url} className="size-10 ring-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{match.name}</p>
          <p className="text-muted-foreground truncate text-xs">{match.city}</p>
        </div>
        <Link
          href={`/chooser/institution/?id=${encodeURIComponent(match.university_id)}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={t("open")}
        >
          <Icons.externalLink aria-hidden />
        </Link>
      </div>
      {chat.isPending ? <Skeleton className="h-64 w-full" /> : null}
      {chat.isError ? <StateView state="error" error={chat.error} onRetry={() => void chat.refetch()} /> : null}
      {chat.data ? (
        <>
          <Button type="button" variant="outline" size="sm" disabled={running} onClick={() => void run(false)}>
            <Icons.search aria-hidden />
            {running ? t("researching") : t("run")}
          </Button>
          {state.status === "running" && state.text ? (
            <div className="bg-muted/40 max-h-48 overflow-y-auto rounded-lg p-3 text-sm" aria-live="polite">
              <Markdown>{state.text}</Markdown>
            </div>
          ) : null}
          {state.status === "error" ? (
            <p role="alert" className="text-destructive text-sm">
              {runErrorText(state.error)}
            </p>
          ) : null}
          <div className="flex h-[min(28rem,70dvh)] min-h-0 flex-col overflow-hidden">
            <AssistantProvider assistant="admission">
              <AssistantChatPane
                key={chat.data.chat_id}
                chatId={chat.data.chat_id}
                basePath="/colleges/discover"
                navButtons={null}
                bare
                placeholder={t("placeholder")}
                emptyText={t("emptyChat")}
                prefill={prefill}
                aboveComposer={above}
              />
            </AssistantProvider>
          </div>
        </>
      ) : null}
      <DefaultPromptDialog open={promptOpen} onOpenChange={setPromptOpen} />
    </AiTabCard>
  )
}

/** Limit problems that get a friendly panel line instead of the generic failure. */
const LIMIT_KEYS: Record<string, "smartWeekly" | "rateLimited" | undefined> = {
  "ai/smart-weekly-limit": "smartWeekly",
  "common/rate-limited": "rateLimited",
}
