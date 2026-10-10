"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, PageContainer, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { IconLayoutGrid, IconList } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { useUniLibraryAvailability } from "../hooks/use-uni-library"
import { CatalogueResults, ExternalResults } from "./browse-results"
import { ItemFilters, SourceChips } from "./item-filters"
import { UniLibraryBlock } from "./uni-library-block"
import { useBrowseState } from "./use-browse-state"
import { useLayoutPreference } from "./use-layout-preference"

/**
 * `/browse/`: search box, source chips (UniLibrary only when it is on), filters in a sheet, sort and grid/list toggles
 * and the results. Everything that selects is in the URL. The "More from UniLibrary" block sits under a text search.
 */
export function BrowsePage() {
  const t = useT("library.browse")
  const home = useT("library.home")
  const [state, setState] = useBrowseState()
  const availability = useUniLibraryAvailability()
  const [layout, setLayout] = useLayoutPreference()
  const [draft, setDraft] = useState(state.q)

  useEffect(() => setDraft(state.q), [state.q])

  // A shared `?source=external` link means nothing while UniLibrary is off: show the normal catalogue.
  const external = state.source === "external" && availability === "enabled"
  const effective = state.source === "external" && !external ? { ...state, source: "all" as const } : state

  return (
    <PageContainer title={t("title")}>
      <form
        role="search"
        aria-label={home("searchLabel")}
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void setState({ q: draft.trim() })
        }}
      >
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={home("search")}
          aria-label={home("searchLabel")}
          className="min-h-11 flex-1 md:min-h-8"
        />
        <Button type="submit" className="min-h-11 md:min-h-8">
          <Icons.search aria-hidden />
          <span className="sr-only sm:not-sr-only">{home("searchButton")}</span>
        </Button>
      </form>

      <SourceChips value={effective.source} onChange={(source) => void setState({ source })} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ItemFilters
          state={effective}
          onChange={(patch) => void setState(patch)}
          onClear={() =>
            void setState({
              subject: null,
              topic: null,
              tag: null,
              year: null,
              type: null,
              lang: null,
              uploader: null,
              hasText: false,
              shelf: null,
              collection: null,
            })
          }
        />
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="sr-only sm:not-sr-only">{t("sortLabel")}</span>
            <select
              className="border-input bg-background h-11 rounded-lg border px-2 text-sm md:h-8"
              value={state.sort ?? (state.q.trim() ? "relevance" : "newest")}
              onChange={(event) => {
                const sort = event.target.value
                if (sort === "relevance" || sort === "newest" || sort === "title" || sort === "author")
                  void setState({ sort })
              }}
            >
              {(["relevance", "newest", "title", "author"] as const).map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sort.${sort}`)}
                </option>
              ))}
            </select>
          </label>
          <ToggleGroup
            aria-label={t("layoutLabel")}
            value={[layout]}
            onValueChange={(value) => {
              const next = value[0]
              if (next === "grid" || next === "list") setLayout(next)
            }}
          >
            <ToggleGroupItem value="grid" aria-label={t("layout.grid")} className="size-11 md:size-8">
              <IconLayoutGrid aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={t("layout.list")} className="size-11 md:size-8">
              <IconList aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {external ? (
        <ExternalResults state={effective} layout={layout} />
      ) : (
        <CatalogueResults state={effective} layout={layout} />
      )}

      {!external && effective.source === "all" ? (
        <UniLibraryBlock q={effective.q} subjectId={effective.subject ?? undefined} />
      ) : null}
    </PageContainer>
  )
}
