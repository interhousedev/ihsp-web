"use client"

import { getLibraryItemsQuery, type ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, Skeleton, useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { TOUCH } from "../../shared/utils/touch"

const MAX_RESULTS = 8

/** A catalogue card that has a stored item (UniLibrary records have none). */
export type PickableItem = ItemCard & { id: string }

function isPickable(card: ItemCard): card is PickableItem {
  return card.kind !== "external" && card.id !== null
}

/** Library catalogue search: type two letters, pick one book. */
export function LibraryItemSearch({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (item: PickableItem) => void
}) {
  const t = useT("subjects.materials.add")
  const fieldId = useId()
  const [text, setText] = useState("")
  const q = useDebounce(text.trim(), 250)
  const search = useQuery({ ...getLibraryItemsQuery({ q, limit: MAX_RESULTS }), enabled: q.length >= 2 })
  const results = (search.data?.items ?? []).filter(isPickable)

  return (
    <div className="flex flex-col gap-3">
      <LabeledField label={t("searchLabel")} htmlFor={fieldId} description={t("searchHint")}>
        <Input
          id={fieldId}
          type="search"
          value={text}
          className={TOUCH}
          onChange={(event) => setText(event.target.value)}
        />
      </LabeledField>
      {q.length >= 2 ? (
        <div aria-live="polite">
          {search.isPending ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : results.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("searchNone")}</p>
          ) : (
            <ul aria-label={t("searchResults")} className="flex flex-col gap-2">
              {results.map((card) => (
                <li key={card.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium break-words">{card.title}</span>
                    <span className="text-muted-foreground text-xs">{card.author_label}</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className={`${TOUCH} shrink-0`}
                    disabled={selectedId === card.id}
                    aria-label={t("pickFor", { title: card.title })}
                    onClick={() => onSelect(card)}
                  >
                    {selectedId === card.id ? t("picked") : t("pick")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
