"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import { StudioEmpty } from "./studio-empty"
import { StudioItem } from "./studio-item"

export type StudioListProps = {
  notebookId: string
  /** The polling query of the list (see `useArtifactPolling`). */
  query: Pick<UseQueryResult<ArtifactItem[]>, "data" | "isPending" | "isError" | "error" | "refetch">
}

/** The finished and running outputs of the notebook, newest first, with loading, error and empty states. */
export function StudioList({ notebookId, query }: StudioListProps) {
  const t = useT("notebooks.studio")

  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (!query.data || query.data.length === 0) return <StudioEmpty />

  return (
    <ul aria-label={t("items")} className="flex flex-col gap-1">
      {query.data.map((item) => (
        <StudioItem key={item.id} item={item} notebookId={notebookId} />
      ))}
    </ul>
  )
}
