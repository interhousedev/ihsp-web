"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import "./duo-coach.css"

const LADDER = [{ level: 1 }, { level: 2 }, { level: 3 }] as const

export type CoachMessage = {
  id: string
  from: "coach" | "me"
  text: string
  tag?: "hint" | "mistake" | "ask" | "answer"
}

/**
 * The AI Coach as the main surface of the lesson: a thread, the hint ladder (one rung at a time, level 3 only after an
 * attempt, never the final answer), "Explain my mistake" and a free question. Everything it says is canned here.
 */
export function CoachPanel({
  hintLevel,
  attempts,
  messages,
  question,
  onHint,
  onAsk,
  onClose,
}: {
  hintLevel: number
  attempts: number
  messages: CoachMessage[]
  question: string
  onHint: () => void
  onAsk: (text: string) => void
  onClose: () => void
}) {
  const t = useT("duo")
  const [draft, setDraft] = useState("")
  const thread = useRef<HTMLDivElement>(null)
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight })
  }, [messages.length])

  const nextLevel = hintLevel + 1
  const gated = nextLevel === 3 && attempts === 0
  const exhausted = hintLevel >= 3

  return (
    <aside className="dc-coach" aria-label={t("coach.title")} data-testid="coach-panel">
      <header className="dc-coach-head">
        <span className="dc-avatar" aria-hidden>
          <Icons.sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{t("coach.title")}</p>
          <p className="text-xs font-semibold opacity-90">{t("coach.subtitle")}</p>
        </div>
        <button type="button" className="dc-coach-close" aria-label={t("coach.close")} onClick={onClose}>
          <Icons.close aria-hidden />
        </button>
      </header>
      <p className="dc-coach-q">{question}</p>

      <div className="dc-thread" ref={thread} aria-live="polite">
        {messages.length === 0 ? (
          <p className="dc-msg" data-from="coach">
            {t("coach.greeting")}
          </p>
        ) : (
          messages.map((message) => (
            <p key={message.id} className="dc-msg" data-from={message.from}>
              {message.tag ? <span className="dc-msg-tag">{t(`coach.tag.${message.tag}`)}</span> : null}
              {message.text}
            </p>
          ))
        )}
      </div>

      {
        <div className="dc-ladder-block">
          <ol className="dc-ladder" aria-label={t("coach.ladder")}>
            {LADDER.map((hint) => {
              const state = hint.level <= hintLevel ? "used" : hint.level === nextLevel ? "next" : "locked"
              const blocked = state === "next" && gated
              return (
                <li key={hint.level}>
                  <button
                    type="button"
                    className="dc-rung"
                    data-state={state}
                    disabled={state !== "next" || blocked}
                    onClick={onHint}
                    data-testid={state === "next" ? "hint-next" : undefined}
                  >
                    <span className="dc-rung-dot" aria-hidden>
                      {state === "used" ? <Icons.check className="size-3.5" /> : hint.level}
                    </span>
                    <span className="min-w-0 flex-1 text-left">{t("coach.hintN", { n: hint.level })}</span>
                    {hint.level === 3 && attempts === 0 && state !== "used" ? (
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        <Icons.lock className="size-3.5" aria-hidden />
                        {t("coach.afterAttempt")}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ol>
          {exhausted ? <p className="px-4 pt-2 text-sm font-semibold">{t("coach.noMoreHints")}</p> : null}
        </div>
      }

      <form
        className="dc-ask"
        onSubmit={(event) => {
          event.preventDefault()
          const text = draft.trim()
          if (text === "") return
          onAsk(text)
          setDraft("")
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("coach.askPlaceholder")}
          aria-label={t("coach.askPlaceholder")}
        />
        <button type="submit" className="pl-icon-btn" aria-label={t("coach.send")} disabled={draft.trim() === ""}>
          <Icons.send aria-hidden />
        </button>
      </form>
    </aside>
  )
}
