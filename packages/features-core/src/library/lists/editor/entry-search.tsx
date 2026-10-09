"use client"

import { getLibraryItemsQuery, getUniLibrarySearchQuery, postUniLibraryPin, type ItemCard } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Skeleton, useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { cardKey } from "../../catalog/card-utils"
import { SourceTag } from "../../catalog/source-tag"
import { useUniLibraryEnabled } from "../../hooks/use-uni-library"

const MIN_QUERY = 2
const LIMIT = 8

type Source = "library" | "unilibrary"

function ResultRow({
  card,
  added,
  disabled,
  onAdd,
}: {
  card: ItemCard
  added: boolean
  disabled: boolean
  onAdd: (card: ItemCard) => Promise<void>
}) {
  const t = useT("library.listEditor.search")
  const library = useT("library")
  const errorMessage = useErrorMessage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border p-2">
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceTag source={card.tag.source} />
          <span className="text-muted-foreground text-xs">{library(`type.${card.type}`)}</span>
        </div>
        <p className="font-medium break-words">{card.title}</p>
        {card.author_label ? <p className="text-muted-foreground text-xs">{card.author_label}</p> : null}
        {error ? (
          <p role="alert" className="text-destructive text-xs">
            {errorMessage(error)}
          </p>
        ) : null}
      </div>
      {added ? (
        <span className="text-muted-foreground inline-flex min-h-11 items-center gap-1 text-sm">
          <Icons.check className="size-4" aria-hidden />
          {t("added")}
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={disabled || busy}
          aria-label={t("addNamed", { title: card.title })}
          onClick={() => {
            setBusy(true)
            setError(null)
            onAdd(card)
              .catch(setError)
              .finally(() => setBusy(false))
          }}
        >
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      )}
    </li>
  )
}

/**
 * Finds items to add: a search of the catalogue (books and materials) and, only when UniLibrary is on, a UniLibrary
 * search whose records are pinned first (`postUniLibraryPin`) so they have an id to be stored by.
 */
export function EntrySearch({
  isAdded,
  full,
  onAdd,
}: {
  isAdded: (card: ItemCard) => boolean
  full: boolean
  onAdd: (card: ItemCard) => void
}) {
  const t = useT("library.listEditor.search")
  const source = useT("library.source")
  const inputId = useId()
  const uniLibrary = useUniLibraryEnabled()
  const [text, setText] = useState("")
  const [where, setWhere] = useState<Source>("library")
  const q = useDebounce(text.trim(), 250)
  const ready = q.length >= MIN_QUERY
  const external = where === "unilibrary" && uniLibrary

  const catalogue = useQuery({
    ...getLibraryItemsQuery({ q, source: "all", limit: LIMIT }),
    enabled: ready && !external,
  })
  const remote = useQuery({
    ...getUniLibrarySearchQuery({ q }),
    enabled: ready && external,
    retry: false,
  })
  const query = external ? remote : catalogue
  const cards = (external ? remote.data?.items : catalogue.data?.items)?.filter(
    (card) => (card.kind === "external") === external,
  )

  async function add(card: ItemCard) {
    if (card.id) {
      onAdd(card)
      return
    }
    // A UniLibrary record is stored once before it can be listed; the answer is the same card with an id.
    if (card.external) onAdd(await postUniLibraryPin(card.external.external_id, { category: card.external.category }))
  }

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">{t("title")}</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1.5">
          <Label htmlFor={inputId}>{t("label")}</Label>
          <Input
            id={inputId}
            type="search"
            value={text}
            placeholder={t("placeholder")}
            autoComplete="off"
            onChange={(event) => setText(event.target.value)}
            // The editor is one form; Enter in the search box searches, it does not save the list.
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault()
            }}
          />
        </div>
        {uniLibrary ? (
          <div role="group" aria-label={t("source")} className="flex gap-2">
            {(["library", "unilibrary"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={where === value ? "default" : "outline"}
                aria-pressed={where === value}
                className="min-h-11 rounded-full px-4"
                onClick={() => setWhere(value)}
              >
                {value === "library" ? t("library") : source("external")}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {full ? (
        <p role="status" className="text-sm font-medium">
          {t("full")}
        </p>
      ) : null}
      {!ready ? (
        <p className="text-muted-foreground text-sm">{t("hint", { count: MIN_QUERY })}</p>
      ) : query.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-destructive">{external ? t("externalError") : t("error")}</span>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => void query.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : (cards ?? []).length === 0 ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("none")}
        </p>
      ) : (
        <>
          <p role="status" className="sr-only">
            {t("count", { count: cards?.length ?? 0 })}
          </p>
          <ul aria-label={t("results")} className="flex flex-col gap-2">
            {cards?.map((card) => (
              <ResultRow key={cardKey(card)} card={card} added={isAdded(card)} disabled={full} onAdd={add} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
