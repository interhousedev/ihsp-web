"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Spinner } from "@ihsp/ui"
import { IconSearch, IconX } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { ReaderSheet } from "./reader-sheet"
import type { SearchHit } from "./reader-types"

const MAX_SHOWN = 200

export type SearchPanelProps = {
  open: boolean
  onOpenChange(open: boolean): void
  /** `true` for a scan without text: there is nothing to search. */
  noText: boolean
  /** The view's search; `null` while the view is not ready. */
  search: ((query: string, signal: AbortSignal) => AsyncIterable<SearchHit>) | null
  onSelect(hit: SearchHit): void
  onClear(): void
}

/**
 * "Search in this item": the query is normalised the way the catalogue search does it, so for Uzbek items the Cyrillic
 * and the Latin spelling find each other. Results stream in page by page (a long book shows the first ones at once)
 * and are announced politely; a tap goes to the place and, on a phone, closes the panel to show it.
 */
export function SearchPanel({ open, onOpenChange, noText, search, onSelect, onClear }: SearchPanelProps) {
  const t = useT("library.reader")
  const errorMessage = useErrorMessage()
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [state, setState] = useState<"idle" | "searching" | "done" | "error">("idle")
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  async function run() {
    const text = query.trim()
    if (!text || !search) return
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    onClear()
    setHits([])
    setError(null)
    setState("searching")
    try {
      for await (const hit of search(text, next.signal)) {
        if (next.signal.aborted) return
        setHits((current) => (current.length >= MAX_SHOWN ? current : [...current, hit]))
      }
      if (!next.signal.aborted) setState("done")
    } catch (problem) {
      if (next.signal.aborted) return
      setError(problem)
      setState("error")
    }
  }

  function clear() {
    controller.current?.abort()
    setQuery("")
    setHits([])
    setState("idle")
    onClear()
  }

  return (
    <ReaderSheet open={open} onOpenChange={onOpenChange} title={t("search")}>
      {noText ? (
        <p role="status" className="text-muted-foreground p-4 text-sm">
          {t("noTextSearch")}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <form
            role="search"
            aria-label={t("search")}
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void run()
            }}
          >
            <Input
              type="search"
              value={query}
              autoFocus
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 flex-1 md:min-h-8"
            />
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={!search || query.trim() === ""}>
              <IconSearch aria-hidden />
              <span className="sr-only sm:not-sr-only">{t("searchSubmit")}</span>
            </Button>
            {state !== "idle" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("searchClear")}
                className="size-11 md:size-8"
                onClick={clear}
              >
                <IconX aria-hidden />
              </Button>
            ) : null}
          </form>
          <div aria-live="polite" className="text-muted-foreground flex items-center gap-2 text-sm">
            {state === "searching" ? (
              <>
                <Spinner aria-hidden />
                <span>{t("searching")}</span>
              </>
            ) : null}
            {state === "done" && hits.length === 0 ? <span>{t("searchNone")}</span> : null}
            {state === "error" ? <span role="alert">{errorMessage(error)}</span> : null}
            {hits.length > 0 ? <span>{t("searchResults", { count: hits.length })}</span> : null}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label={t("searchResultsLabel")}>
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(hit)
                    // The panel is modal and covers the page: close it to show the place.
                    onOpenChange(false)
                  }}
                  className="hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full flex-col gap-0.5 rounded-md p-2 text-start text-sm outline-none focus-visible:ring-2"
                >
                  <span className="text-muted-foreground text-xs">
                    {hit.page !== null ? t("searchPage", { page: hit.page }) : (hit.label ?? "")}
                  </span>
                  <span className="break-words">
                    …{hit.excerpt.pre}
                    <mark className="bg-yellow-300/60 text-foreground rounded-[2px] dark:bg-yellow-300/40">
                      {hit.excerpt.match}
                    </mark>
                    {hit.excerpt.post}…
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReaderSheet>
  )
}
