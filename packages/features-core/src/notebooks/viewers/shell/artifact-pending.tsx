"use client"

import type { ArtifactDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconAlertTriangle, IconLoader2, IconPlayerStop } from "@tabler/icons-react"
import { useRetryArtifact } from "../../api/use-artifacts"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { ViewerProgress } from "../progress-bar"

type ArtifactPendingProps = {
  notebookId: string
  artifact: ArtifactDetail
  /** Reloads the artifact after "Try again" so the viewer starts polling the new run. */
  onRetried: () => void
}

/** What the viewer shows instead of the content while the item is queued, generating, failed or canceled. */
export function ArtifactPending({ notebookId, artifact, onRetried }: ArtifactPendingProps) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const retry = useRetryArtifact(notebookId)

  if (artifact.status === "failed") {
    const code = artifact.error?.code ?? "generic"
    const reason = t.has(`artifactError.${code}`) ? t(`artifactError.${code}`) : t("artifactError.generic")
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <IconAlertTriangle aria-hidden className="text-destructive size-8" />
        <p className="font-medium">{t("item.failed")}</p>
        <p className="text-muted-foreground max-w-prose text-sm">{reason}</p>
        {retry.error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(retry.error)}
          </p>
        ) : null}
        <Button
          type="button"
          className="min-h-11"
          disabled={retry.isPending}
          onClick={() => retry.mutate(artifact.id, { onSuccess: onRetried })}
        >
          {t("item.retry")}
        </Button>
      </div>
    )
  }

  if (artifact.status === "canceled") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 p-8 text-center">
        <IconPlayerStop aria-hidden className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">{t("artifactError.canceled")}</p>
      </div>
    )
  }

  return (
    <div role="status" className="flex flex-col items-center gap-3 p-8 text-center">
      <IconLoader2 aria-hidden className="text-primary size-8 animate-spin motion-reduce:animate-none" />
      <p className="max-w-prose text-sm">{t("item.generating")}</p>
      {artifact.progress !== null ? (
        <div className="w-full max-w-xs">
          <ViewerProgress value={Math.round(artifact.progress * 100)} max={100} label={t("item.generating")} />
        </div>
      ) : null}
    </div>
  )
}
