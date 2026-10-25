"use client"

import { getMeFlashcardSetsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { SourceKindIcon } from "../lib/source-icons"
import type { PickTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"

/** The student's flash card sets with their card counts. */
export function PickFlashcardsTab({ sources, selection, full }: PickTabProps) {
  const t = useT("notebooks")
  const sets = useQuery(getMeFlashcardSetsQuery())
  const added = new Set(
    sources.filter((source) => source.kind === "flashcard_set").map((source) => refValue(source, "set_id")),
  )
  const items = sets.data ?? []

  if (sets.isPending) return <StateView state="loading" rows={3} />
  if (sets.isError) return <StateView state="error" error={sets.error} onRetry={() => void sets.refetch()} />
  if (items.length === 0) return <StateView state="empty" emptyText={t("add.flashcards.empty")} />
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((set) => {
        const key = `fc:${set.id}`
        const already = added.has(set.id)
        const empty = set.card_count === 0
        const checked = already || selection.has(key)
        return (
          <PickRow
            key={set.id}
            label={set.title}
            meta={t("add.flashcards.cards", { count: set.card_count })}
            note={already ? t("add.alreadyAdded") : empty ? t("add.flashcards.noCards") : undefined}
            icon={<SourceKindIcon kind="flashcard_set" />}
            checked={checked}
            disabled={already || empty || (full && !checked)}
            onToggle={() =>
              selection.toggle({ key, input: { kind: "flashcard_set", set_id: set.id }, label: set.title })
            }
          />
        )
      })}
    </ul>
  )
}
