"use client"

import { useT } from "@ihsp/i18n"
import { useFlashcardSets } from "../../../flashcards/hooks/use-flashcards"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber } from "./shared"

export function FlashcardsDueWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const sets = useFlashcardSets().data ?? []
  const due = sets.reduce((sum, set) => sum + set.due_count, 0)
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.flashcards_due")} href="/flashcards/">
      <BigNumber value={due} label={t("cardsDue")} />
    </WidgetFrame>
  )
}
