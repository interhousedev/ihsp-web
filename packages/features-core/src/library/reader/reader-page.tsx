"use client"

import { getLibraryItemQuery, isApiError, type ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { buttonVariants, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { NotAvailable } from "../catalog"
import { useLibraryAccess } from "../hooks/use-library-access"
import { itemHref } from "../utils/hrefs"
import type { ReaderEngines } from "./lib/load-engines"
import { parseLocator, readStoredFraction, readStoredPosition } from "./lib/locator"
import { pickFile } from "./lib/pick-file"
import { ReaderFrame } from "./reader-frame"

/** Answers that mean "you cannot read this" without saying why (not found, hidden, not for the lyceum, UniLibrary). */
const HIDDEN = new Set([401, 403, 404, 409])

function Opening({
  item,
  file,
  params,
  engines,
}: {
  item: ItemDetail
  file: NonNullable<ReturnType<typeof pickFile>>
  params: URLSearchParams
  engines: ReaderEngines | undefined
}) {
  // Decided once per file: later changes of the address (a moved page) must not reopen the book.
  const [place] = useState(() => {
    const locator =
      parseLocator({ page: params.get("page"), loc: params.get("loc") }) ?? readStoredPosition(item.id!, file.id)
    const stored = readStoredFraction(item.id!, file.id)
    const known = item.progress_percent ? item.progress_percent / 100 : null
    return { locator, fraction: locator ? null : (stored ?? known) }
  })
  return (
    <ReaderFrame
      key={`${item.id}:${file.id}`}
      item={item}
      file={file}
      start={place.locator}
      startFraction={place.fraction}
      {...(engines ? { engines } : {})}
    />
  )
}

/**
 * `/read/?item&file&page&loc`: loads the item, picks the file and opens the reader for its format. Everything that
 * cannot be read (not found, hidden, lyceum-only for a visitor, a UniLibrary record, nothing the browser can draw)
 * ends in the same "This item is not available". Public books are read by visitors too, without notes or progress.
 */
export function ReaderPage({ engines }: { engines?: ReaderEngines }) {
  const t = useT("library.reader")
  const params = useSearchParams()
  const { status } = useLibraryAccess()
  const itemParam = params.get("item")
  const query = useQuery({
    ...getLibraryItemQuery(itemParam ?? ""),
    // After the session was restored, so the request carries the token when there is one.
    enabled: !!itemParam && status !== "loading",
  })

  if (!itemParam) return <NotAvailable />
  if (query.isError) {
    if (isApiError(query.error) && HIDDEN.has(query.error.status)) return <NotAvailable />
    return (
      <div className="p-4">
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }
  const item = query.data
  if (!item) {
    return (
      <div className="p-4">
        <StateView state="loading" rows={4} />
      </div>
    )
  }
  if (item.kind === "external" || !item.id || !item.can.read) return <NotAvailable />

  const file = pickFile(item, params.get("file"))
  if (!file) {
    return (
      <div className="p-4">
        <StateView
          state="empty"
          emptyText={t("unsupported")}
          action={
            <Link
              href={itemHref(item.id)}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              {t("itemPage")}
            </Link>
          }
        />
      </div>
    )
  }
  return <Opening item={item} file={file} params={params} engines={engines} />
}
