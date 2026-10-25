"use client"

import { getUniLibrarySearchQuery, isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Skeleton, buttonVariants } from "@ihsp/ui"
import { IconBuildingBank } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useUniLibraryEnabled } from "../hooks/use-uni-library"
import { browseHref } from "../utils/hrefs"
import { ItemGrid } from "./item-grid"

const PREVIEW_COUNT = 5

/**
 * "More from UniLibrary" under the results of a search: five link-only records loaded in parallel from the server-side
 * search, a banner when the cache answered because UniLibrary is down, and "See all" for the UniLibrary source tab.
 * UniLibrary is a dormant, flag-controlled source: while the API has not confirmed that it is on, this renders
 * **nothing** and sends **no request**.
 */
export function UniLibraryBlock({ q, subjectId }: { q: string; subjectId?: string | undefined }) {
  const t = useT("library.unilibrary")
  const enabled = useUniLibraryEnabled()
  const params = { q, ...(subjectId ? { subject_id: subjectId } : {}) }
  const query = useQuery({
    ...getUniLibrarySearchQuery(params),
    enabled: enabled && q.trim().length > 0,
    retry: false,
  })

  if (!enabled || q.trim().length === 0) return null
  // The flag was switched off meanwhile: still nothing to show.
  if (query.isError && isApiError(query.error) && query.error.type === "library/external-disabled") return null

  const cards = (query.data?.items ?? []).filter((item) => item.kind === "external").slice(0, PREVIEW_COUNT)

  return (
    <section aria-labelledby="unilibrary-block-title" className="flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="unilibrary-block-title" className="flex items-center gap-2 text-base font-semibold">
            <IconBuildingBank className="size-4" aria-hidden />
            {t("more")}
          </h2>
          <p className="text-muted-foreground text-xs">{t("universityLevel")}</p>
        </div>
        <Link
          href={browseHref({ q, source: "external" })}
          className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
        >
          {t("seeAll")}
        </Link>
      </div>
      {query.data?.stale ? (
        <p
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
        >
          {t("unavailable")}
        </p>
      ) : null}
      {query.isPending ? (
        <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: PREVIEW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="text-muted-foreground text-sm">
          {t("error")}
        </p>
      ) : cards.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ItemGrid items={cards} label={t("more")} />
      )}
    </section>
  )
}
