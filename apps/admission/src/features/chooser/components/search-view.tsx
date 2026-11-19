"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StateView,
  useIsMobile,
} from "@ihsp/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { NextStep } from "../../../components/next-step"
import { ScrollFade } from "../../../components/scroll-fade"
import { AlgorithmPanel } from "../../algorithm"
import { DiscoverPage } from "../../discover/components/discover-page"
import {
  activeFilterKeys,
  filtersFromParams,
  filtersToSearch,
  SORTS,
  withoutFilters,
  type FilterKey,
  type Filters,
  type SortKey,
} from "../filters"
import { sortInstitutions } from "../facets"
import { useFacets, useInstitutionSearch, useList, useStudyFields } from "../hooks"
import { ActiveChips } from "./active-chips"
import { FieldFocus } from "./field-focus"
import { FiltersPanel } from "./filters-panel"
import { InstitutionCard } from "./institution-card"

const VIEWS = ["list", "discover"] as const
type View = (typeof VIEWS)[number]

export function SearchView() {
  const t = useT("chooser")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params])
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)
  const view: View = params.get("view") === "discover" ? "discover" : "list"
  const prefsOpen = params.get("prefs") === "1"
  const [text, setText] = useState(filters.q ?? "")
  const { facets } = useFacets()
  const { groups } = useStudyFields()
  const search = useInstitutionSearch(filters)
  const list = useList()
  const items = useMemo(
    () => sortInstitutions(search.data?.pages.flatMap((page) => page.items) ?? [], filters.sort),
    [search.data, filters.sort],
  )
  const active = activeFilterKeys(filters)

  /** The address for the filters, keeping the view and the preferences panel. */
  function href(next: Filters, extra: { view?: View; prefs?: boolean } = {}) {
    const search = new URLSearchParams(filtersToSearch(next).slice(1))
    const nextView = extra.view ?? view
    if (nextView === "discover") search.set("view", "discover")
    if (extra.prefs ?? prefsOpen) search.set("prefs", "1")
    const text = search.toString()
    return `${pathname}${text ? `?${text}` : ""}`
  }

  function apply(next: Filters) {
    setSheetOpen(false)
    router.replace(href(next))
  }

  const panel = (
    <FiltersPanel key={params.toString()} filters={filters} facets={facets} groups={groups} onApply={apply} />
  )

  let results
  if (search.isLoading) results = <StateView state="loading" rows={4} />
  else if (search.isError)
    results = <StateView state="error" error={search.error} onRetry={() => void search.refetch()} />
  else if (items.length === 0)
    results = (
      <StateView
        state={active.length > 0 || filters.q ? "filtered" : "empty"}
        emptyText={t("noResults")}
        onReset={() => apply(withoutFilters(filters, [...active, "q"]))}
      />
    )
  else
    results = (
      <div className="flex min-w-0 flex-col gap-3">
        <ul className="grid min-w-0 gap-3 lg:grid-cols-2" aria-label={t("resultsLabel")}>
          {items.map((institution) => (
            <li key={institution.id} className="min-w-0">
              <InstitutionCard institution={institution} />
            </li>
          ))}
        </ul>
        {search.hasNextPage ? (
          <Button
            variant="outline"
            className="self-center"
            disabled={search.isFetchingNextPage}
            onClick={() => void search.fetchNextPage()}
          >
            {t("loadMore")}
          </Button>
        ) : null}
      </div>
    )

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div role="group" aria-label={t("view.label")} className="bg-muted inline-flex rounded-lg p-1">
        {VIEWS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => router.replace(href(filters, { view: key }))}
            className="aria-pressed:bg-background aria-pressed:shadow-sm inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium"
          >
            {t(`view.${key}`)}
          </button>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={() => router.replace(href(filters, { prefs: true }))}>
        <Icons.discover aria-hidden />
        {t("prefs.open")}
      </Button>
    </div>
  )

  const prefsSheet = (
    <Sheet open={prefsOpen} onOpenChange={(open) => !open && router.replace(href(filters, { prefs: false }))}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[100dvh] overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>{t("prefs.title")}</SheetTitle>
        </SheetHeader>
        <AlgorithmPanel />
      </SheetContent>
    </Sheet>
  )

  if (view === "discover") {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        {toolbar}
        <FieldFocus />
        <DiscoverPage />
        {prefsSheet}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      {isMobile ? null : (
        <aside className="flex flex-col gap-3 md:sticky md:top-4 md:max-h-[calc(100dvh-9rem)] md:self-start md:overflow-y-auto md:pr-1">
          {panel}
        </aside>
      )}
      <div className="flex min-w-0 flex-col gap-4">
        {toolbar}
        <FieldFocus />
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            apply({ ...filters, q: text.trim() })
          }}
        >
          <Input
            type="search"
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <Button type="submit">{t("searchButton")}</Button>
        </form>
        {isMobile ? (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button type="button" variant="outline" />}>
              <Icons.adjustments aria-hidden />
              {t("filters.title")}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-4">
              <SheetHeader>
                <SheetTitle>{t("filters.title")}</SheetTitle>
              </SheetHeader>
              {panel}
            </SheetContent>
          </Sheet>
        ) : null}
        <ActiveChips
          filters={filters}
          active={active}
          facets={facets}
          groups={groups}
          onRemove={(key) => apply(withoutFilters(filters, [key]))}
          onClearAll={() => apply(withoutFilters(filters, active))}
        />
        {items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {search.hasNextPage ? t("resultsMore", { count: items.length }) : t("results", { count: items.length })}
            </p>
            <label className="flex items-center gap-2 text-sm">
              {t("sort.label")}
              <select
                className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
                value={filters.sort}
                onChange={(event) => apply({ ...filters, sort: event.target.value as SortKey })}
              >
                {SORTS.map((sort) => (
                  <option key={sort} value={sort}>
                    {t(`sort.${sort}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        <ScrollFade maxHeight={isMobile ? undefined : "calc(100dvh - 22rem)"} className="pr-1">
          {results}
        </ScrollFade>
        <NextStep href="/chooser/list/" label={t("nextStep.review", { count: list.data?.length ?? 0 })} />
      </div>
      {prefsSheet}
    </div>
  )
}
