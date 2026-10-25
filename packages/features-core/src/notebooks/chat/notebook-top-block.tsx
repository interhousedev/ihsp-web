"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { NotebookSummary } from "./notebook-summary"
import { SuggestedQuestions } from "./suggested-questions"

type NotebookTopBlockProps = {
  notebook: NotebookDetail
  /** Suggested questions are disabled while a turn runs or nothing can be asked. */
  askDisabled: boolean
  onAsk: (text: string) => void
}

/** What scrolls with the conversation, like NotebookLM: emoji, title, "N sources · date", summary and suggestions. */
export function NotebookTopBlock({ notebook, askDisabled, onAsk }: NotebookTopBlockProps) {
  const t = useT("notebooks.chat")
  const format = useFormatters()
  const meta = t("meta", {
    sources: t("sourcesCount", { count: notebook.source_count }),
    date: format.date(notebook.created_at),
  })

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        {notebook.emoji ? (
          <span className="text-4xl leading-none" aria-hidden>
            {notebook.emoji}
          </span>
        ) : null}
        <h2 className="text-xl font-semibold break-words">{notebook.title}</h2>
        <p className="text-muted-foreground text-xs">{meta}</p>
      </div>
      <NotebookSummary notebook={notebook} />
      {notebook.summary ? (
        <SuggestedQuestions questions={notebook.summary.suggested_questions} disabled={askDisabled} onAsk={onAsk} />
      ) : null}
    </header>
  )
}
