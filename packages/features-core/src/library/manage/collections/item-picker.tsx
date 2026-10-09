"use client"

import { getLibraryItemsQuery, type ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, Label, Skeleton, useDebounce } from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconPlus, IconX } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { SourceTag } from "../../catalog/source-tag"

const MAX_RESULTS = 8

function Line({ card }: { card: ItemCard }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-medium break-words">{card.title}</span>
      <span className="text-muted-foreground text-xs">{card.author_label}</span>
    </span>
  )
}

/**
 * Collection items by catalogue search: type a word, **Add** a result; the chosen items are listed in the order they
 * will have in the collection, with move up, move down and remove. UniLibrary records are never offered (they have no
 * stored item).
 */
export function ItemPicker({
  selected,
  onChange,
}: {
  selected: readonly ItemCard[]
  onChange: (items: ItemCard[]) => void
}) {
  const t = useT("library.manage.collections")
  const id = useId()
  const [text, setText] = useState("")
  const q = useDebounce(text.trim(), 250)
  const search = useQuery({ ...getLibraryItemsQuery({ q, limit: MAX_RESULTS }), enabled: q.length >= 2 })
  const taken = new Set(selected.map((card) => card.id))
  const results = (search.data?.items ?? []).filter((card) => card.kind !== "external" && card.id)

  function move(index: number, step: -1 | 1) {
    const next = [...selected]
    const target = index + step
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    if (item) next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-q`}>{t("pickerSearch")}</Label>
        <Input
          id={`${id}-q`}
          type="search"
          value={text}
          className="min-h-11 md:min-h-8"
          onChange={(event) => setText(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("pickerHint")}</p>
      </div>

      {q.length >= 2 ? (
        <div aria-live="polite">
          {search.isPending ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : results.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("pickerNone")}</p>
          ) : (
            <ul aria-label={t("pickerResults")} className="flex flex-col gap-2">
              {results.map((card) => (
                <li key={card.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <SourceTag source={card.tag.source} />
                    <Line card={card} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 shrink-0 md:min-h-8"
                    disabled={taken.has(card.id)}
                    aria-label={t("pickerAdd", { title: card.title })}
                    onClick={() => onChange([...selected, card])}
                  >
                    <IconPlus aria-hidden />
                    {taken.has(card.id) ? t("pickerAdded") : t("pickerAddShort")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("chosen", { count: selected.length })}</h3>
        {selected.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("chosenNone")}</p>
        ) : (
          <ol aria-label={t("chosenList")} className="flex flex-col gap-2">
            {selected.map((card, index) => (
              <li key={card.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <Line card={card} />
                <span className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8"
                    disabled={index === 0}
                    aria-label={t("moveUp", { title: card.title })}
                    onClick={() => move(index, -1)}
                  >
                    <IconArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8"
                    disabled={index === selected.length - 1}
                    aria-label={t("moveDown", { title: card.title })}
                    onClick={() => move(index, 1)}
                  >
                    <IconArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8"
                    aria-label={t("removeItem", { title: card.title })}
                    onClick={() => onChange(selected.filter((item) => item.id !== card.id))}
                  >
                    <IconX aria-hidden />
                  </Button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
