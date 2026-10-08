"use client"

import type { FlashcardSetItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Where a set came from; manual sets need no badge. */
export function SourceBadge({ source }: { source: FlashcardSetItem["source"] }) {
  const t = useT("flashcards.source")
  if (source === "manual") return null
  return <Badge variant="secondary">{t(source)}</Badge>
}
