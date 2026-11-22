"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Icons,
  Input,
  StateView,
} from "@ihsp/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ScrollFade } from "../../../components/scroll-fade"
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
import { ListTray } from "./list-tray"
import { InstitutionRow } from "./institution-row"
import { useListRows } from "../use-list-rows"

const VIEWS = ["list", "discover"] as const
type View = (typeof VIEWS)[number]

export function SearchView() {
  const t = useT("chooser")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params])
  const [sheetOpen, setSheetOpen] = useState(false)
  const view: View = params.get("view") === "list" ? "list" : "discover"
  const [text, setText] = useState(filters.q ?? "")
  const { facets } = useFacets()
  const { groups } = useStudyFields()
  const search = useInstitutionSearch(filters)
  const list = useList()
  const listRows = useListRows().rows
  const items = useMemo(
    () => sortInstitutions(search.data?.pages.flatMap((page) => page.items) ?? [], filters.sort),
    [search.data, filters.sort],
  )
  const active = activeFilterKeys(filters)

  /** The address for the filters, keeping the view and the preferences panel. */
  function href(next: Filters, extra: { view?: View } = {}) {
    const search = new URLSearchParams(filtersToSearch(next).slice(1))
    const nextView = extra.view ?? view
    search.set("step", "match")
    if (nextView === "list") search.set("view", "list")
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
        <ul className="flex min-w-0 flex-col" aria-label={t("resultsLabel")}>
          {items.map((institution) => (
            <li key={institution.id} className="min-w-0">
              <InstitutionRow
                institution={institution}
                row={listRows.find((item) => item.entry.institution.id === institution.id)}
              />
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
    </div>
  )

  if (view === "discover") {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <DiscoverPage
          tray={<ListTray onOpenList={() => router.replace(`${pathname}?step=list`)} />}
          lead={
            <>
              {toolbar}
              <FieldFocus />
            </>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden flex-col gap-3 lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        {panel}
      </aside>
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
        <div className="lg:hidden">
          <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
            <DialogTrigger render={<Button type="button" variant="outline" />}>
              <Icons.adjustments aria-hidden />
              {t("filters.title")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("filters.title")}</DialogTitle>
              </DialogHeader>
              {panel}
            </DialogContent>
          </Dialog>
        </div>
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
        <ScrollFade maxHeight="calc(100dvh - 22rem)" className="pr-1">
          {results}
        </ScrollFade>
      </div>
    </div>
  )
}
