"use client"

import { keys } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { IconInfoCircle } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { useArtifact } from "../api/use-artifacts"
import { artifactKindKey } from "../lib/artifact-kinds"
import { useWorkspace } from "../workspace-context"
import { ApplyBar } from "./course/apply-bar"
import { ArtifactPending } from "./shell/artifact-pending"
import { ItemMenu } from "./shell/item-menu"
import { ViewerBody } from "./shell/viewer-body"
import { ViewerHeader } from "./shell/viewer-header"
import { ViewerEmpty } from "./viewer-empty"

export type ArtifactViewerProps = {
  notebookId: string
  artifactId: string
}

/** While a study material is being written the viewer asks the server again every 3 s. */
const POLL_MS = 3000

/**
 * The shell of every Studio viewer: Back, the title, the item menu, the "large
 * notebook" banner, the loading, error, generating, failed and canceled states, and the viewer picked by `kind`.
 * Loading the artifact marks it viewed, so the Studio list is refreshed to clear the blue dot.
 */
export function ArtifactViewer({ notebookId, artifactId }: ArtifactViewerProps) {
  const t = useT("notebooks")
  const queryClient = useQueryClient()
  const { closeViewer } = useWorkspace()
  const titleId = useId()
  const [removed, setRemoved] = useState(false)
  const query = useArtifact(notebookId, removed ? null : artifactId)
  const artifact = query.data
  const status = artifact?.status
  const { refetch } = query

  // Loading marks the item viewed and a finished run changes its row: refresh the Studio list.
  const settled = artifact ? `${artifact.id}:${artifact.status}` : null
  useEffect(() => {
    if (settled === null) return
    void queryClient.invalidateQueries({
      queryKey: keys.notebooks.artifacts(notebookId),
    })
  }, [queryClient, notebookId, settled])

  const active = status === "queued" || status === "generating"
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => void refetch(), POLL_MS)
    return () => clearInterval(timer)
  }, [active, refetch])

  if (removed) return null

  const title = artifact ? artifact.title || t(`kind.${artifactKindKey(artifact)}`) : t("viewers.region")

  return (
    <section aria-labelledby={titleId} className="bg-background flex h-full min-h-0 flex-col print:block print:h-auto">
      <ViewerHeader
        titleId={titleId}
        title={title}
        menu={
          artifact ? (
            <ItemMenu
              notebookId={notebookId}
              artifactId={artifact.id}
              title={artifact.title}
              kind={artifact.kind}
              status={artifact.status}
              onDeleted={() => {
                setRemoved(true)
                closeViewer()
              }}
            />
          ) : null
        }
      />
      {artifact?.sampled ? (
        <p
          role="note"
          className="bg-muted text-muted-foreground flex shrink-0 items-start gap-2 border-b px-4 py-2 text-xs print:hidden"
        >
          <IconInfoCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("item.sampled")}
        </p>
      ) : null}
      {artifact && artifact.status === "ready" ? <ApplyBar notebookId={notebookId} artifact={artifact} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
        {query.isPending ? <StateView state="loading" rows={4} className="m-4" /> : null}
        {query.isError && !artifact ? (
          <StateView state="error" error={query.error} onRetry={() => void refetch()} className="m-4" />
        ) : null}
        {artifact && artifact.status !== "ready" ? (
          <ArtifactPending notebookId={notebookId} artifact={artifact} onRetried={() => void refetch()} />
        ) : null}
        {artifact && artifact.status === "ready" ? (
          artifact.content === null ? (
            <ViewerEmpty />
          ) : (
            <ViewerBody notebookId={notebookId} artifact={artifact} />
          )
        ) : null}
      </div>
    </section>
  )
}
