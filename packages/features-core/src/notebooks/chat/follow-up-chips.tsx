"use client"

import { useT } from "@ihsp/i18n"
import { QuestionChip } from "./question-chip"

const MAX_FOLLOWUPS = 3

type FollowUpChipsProps = {
  followups: readonly string[]
  disabled?: boolean
  onAsk: (text: string) => void
}

/** Up to three follow-up questions the model proposed under its answer. */
export function FollowUpChips({ followups, disabled, onAsk }: FollowUpChipsProps) {
  const t = useT("notebooks.chat")
  const shown = followups.filter((text) => text.trim() !== "").slice(0, MAX_FOLLOWUPS)
  if (shown.length === 0) return null
  return (
    <ul aria-label={t("followups")} className="flex flex-wrap gap-2">
      {shown.map((text) => (
        <li key={text} className="max-w-full">
          <QuestionChip text={text} disabled={disabled} onAsk={onAsk} />
        </li>
      ))}
    </ul>
  )
}
