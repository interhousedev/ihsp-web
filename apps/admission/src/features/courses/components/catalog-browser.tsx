"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { useState } from "react"
import { CATALOG_PAGE, useCourseCatalog, type CatalogFilter } from "../api"
import { CatalogCard } from "./catalog-card"

const FILTERS: readonly CatalogFilter[] = ["all", "course", "book"]

/** Every published LMS course and library book: search, filter by type, open the item. */
export function CatalogBrowser() {
  const t = useT("courses")
  const [text, setText] = useState("")
  const [kind, setKind] = useState<CatalogFilter>("all")
  const [limit, setLimit] = useState(CATALOG_PAGE)
  const query = useDebounce(text.trim(), 250)
  const catalog = useCourseCatalog(query, kind, limit)
  return (
    <section id="courses-catalog" className="flex scroll-mt-20 flex-col gap-3" aria-labelledby="courses-catalog-title">
      <div>
        <h2 id="courses-catalog-title" className="text-lg font-semibold">
          {t("catalog.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("catalog.hint")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          {t("catalog.search")}
          <Input
            type="search"
            value={text}
            maxLength={100}
            onChange={(e) => {
              setText(e.target.value)
              setLimit(CATALOG_PAGE)
            }}
          />
        </label>
        <div role="group" aria-label={t("catalog.filter")} className="flex gap-2">
          {FILTERS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={kind === value ? "default" : "outline"}
              aria-pressed={kind === value}
              className="min-h-11 md:min-h-9"
              onClick={() => {
                setKind(value)
                setLimit(CATALOG_PAGE)
              }}
            >
              {t(`catalog.filters.${value}`)}
            </Button>
          ))}
        </div>
      </div>
      {catalog.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : catalog.isError ? (
        <StateView state="error" error={catalog.error} onRetry={() => void catalog.refetch()} />
      ) : catalog.data.items.length === 0 ? (
        <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">{t("catalog.empty")}</p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {catalog.data.items.map((entry) => (
              <CatalogCard key={`${entry.kind}:${entry.id}`} entry={entry} />
            ))}
          </ul>
          {catalog.data.has_more ? (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              onClick={() => setLimit(limit + CATALOG_PAGE)}
            >
              {t("catalog.more")}
            </Button>
          ) : null}
        </>
      )}
    </section>
  )
}
