"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
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
import {
  activeFilterKeys,
  filtersFromParams,
  filtersToSearch,
  withoutFilters,
  type FilterKey,
  type Filters,
} from "../filters"
import { useFacets, useInstitutionSearch } from "../hooks"
import { FiltersPanel } from "./filters-panel"
import { InstitutionCard } from "./institution-card"

/** The filters that hide everything because the catalog holds no value for them at all. */
export function dataLessFilters(active: FilterKey[], empty: Set<FilterKey> | undefined): FilterKey[] {
  return empty ? active.filter((key) => empty.has(key)) : []
}

export function SearchView() {
  const t = useT("chooser")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params])
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [text, setText] = useState(filters.q)
  const { facets } = useFacets()
  const search = useInstitutionSearch(filters)
  const items = search.data?.pages.flatMap((page) => page.items) ?? []
  const active = activeFilterKeys(filters)
  const missing = dataLessFilters(active, facets?.empty)
  const filterLabel = (key: FilterKey) => t(`filters.${key}`)

  function apply(next: Filters) {
    setSheetOpen(false)
    router.replace(`${pathname}${filtersToSearch(next)}`)
  }

  const panel = <FiltersPanel key={params.toString()} filters={filters} facets={facets} onApply={apply} />

  let results
  if (search.isLoading) results = <StateView state="loading" rows={4} />
  else if (search.isError)
    results = <StateView state="error" error={search.error} onRetry={() => void search.refetch()} />
  else if (items.length === 0 && missing.length > 0)
    results = (
      <StateView
        state="empty"
        icon={<Icons.info className="size-8" aria-hidden />}
        title={t("noData.title")}
        description={t("noData.text", { filters: missing.map(filterLabel).join(", ") })}
        action={
          <Button variant="outline" onClick={() => apply(withoutFilters(filters, missing))}>
            {t("noData.clear")}
          </Button>
        }
      />
    )
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
      <div className="flex flex-col gap-3">
        <ul className="grid gap-3 lg:grid-cols-2" aria-label={t("results")}>
          {items.map((institution) => (
            <li key={institution.id}>
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

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      {isMobile ? null : <aside className="flex flex-col gap-3">{panel}</aside>}
      <div className="flex min-w-0 flex-col gap-4">
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
        {results}
      </div>
    </div>
  )
}
