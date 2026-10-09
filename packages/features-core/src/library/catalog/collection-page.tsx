"use client"

import { getLibraryCollectionQuery, isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useVisibleCards } from "../hooks/use-uni-library"
import { ItemGrid } from "./item-grid"
import { NotAvailable } from "./not-available"
import { useLayoutPreference } from "./use-layout-preference"

/** `/collections/view/?id=`: a librarian-curated collection. */
export function CollectionPage() {
  const t = useT("library.collection")
  const id = useSearchParams().get("id")
  const query = useQuery({ ...getLibraryCollectionQuery(id ?? ""), enabled: Boolean(id), retry: false })
  const [layout] = useLayoutPreference()
  const items = useVisibleCards(query.data?.items)
  if (!id) return <NotAvailable />
  if (query.isError && isApiError(query.error) && (query.error.status === 404 || query.error.status === 403)) {
    return <NotAvailable />
  }
  return (
    <PageContainer title={query.data?.title ?? t("title")} description={query.data?.description ?? undefined}>
      {query.isPending ? (
        <StateView state="loading" />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ItemGrid items={items} layout={layout} label={query.data.title} />
      )}
    </PageContainer>
  )
}
