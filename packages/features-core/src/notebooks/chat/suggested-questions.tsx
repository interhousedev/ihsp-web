"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconChevronDown } from "@tabler/icons-react"
import { useId, useState } from "react"
import { QuestionChip } from "./question-chip"

/** How many question cards show before "Show more": one row of the three-column grid. */
const VISIBLE_QUESTIONS = 3

type SuggestedQuestionsProps = {
  questions: readonly string[]
  disabled?: boolean
  onAsk: (text: string) => void
}

/**
 * The questions of the notebook summary as cards under it; a click sends the question. Three columns when the chat
 * column is wide enough (a container query), one otherwise. The first three show, "Show more" reveals the rest.
 */
export function SuggestedQuestions({ questions, disabled, onAsk }: SuggestedQuestionsProps) {
  const t = useT("notebooks.chat")
  const listId = useId()
  const [expanded, setExpanded] = useState(false)
  if (questions.length === 0) return null
  const shown = expanded ? questions : questions.slice(0, VISIBLE_QUESTIONS)
  return (
    <section aria-label={t("suggested")} className="@container flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">{t("suggested")}</h3>
      <ul id={listId} className="grid grid-cols-1 gap-2 @md:grid-cols-3">
        {shown.map((question) => (
          <li key={question} className="min-w-0">
            <QuestionChip variant="card" text={question} disabled={disabled} onAsk={onAsk} />
          </li>
        ))}
      </ul>
      {questions.length > VISIBLE_QUESTIONS ? (
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={listId}
          className="min-h-11 gap-1 self-start px-2 md:min-h-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t("showLessQuestions") : t("showMoreQuestions")}
          <IconChevronDown
            aria-hidden
            className={cn("transition-transform motion-reduce:transition-none", expanded && "rotate-180")}
          />
        </Button>
      ) : null}
    </section>
  )
}
