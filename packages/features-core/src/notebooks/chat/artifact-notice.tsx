"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useArtifacts } from "../api"
import { isActive } from "../lib"
import { useWorkspace } from "../workspace-context"

type ArtifactNoticeProps = {
  notebookId: string
  artifactId: string
  /** The localized kind name shown inside the message. */
  kind: string
  /** The message group: `chat.quick` or `chat.action`. */
  scope: "chat.quick" | "chat.action"
}

/**
 * The in-chat line after a Studio generation was started. It follows the artifact through the same (polling) list the
 * Studio uses, so it reads "is being created" while the item is queued or generating and "is ready" with a link once
 * it is done.
 */
export function ArtifactNotice({ notebookId, artifactId, kind, scope }: ArtifactNoticeProps) {
  const t = useT(`notebooks.${scope}`)
  const tq = useT("notebooks.chat.quick")
  const workspace = useWorkspace()
  const artifacts = useArtifacts(notebookId)
  const item = artifacts.data?.find((current) => current.id === artifactId)
  const state = !item || isActive(item) ? (scope === "chat.quick" ? "started" : "created") : item.status === "failed" ? "failed" : "ready"
  return (
    <p
      role="status"
      data-state={state === "started" || state === "created" ? "busy" : state}
      className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm"
    >
      {t(state, { kind })}
      {state === "failed" ? null : (
        <Button
          type="button"
          variant="link"
          className="h-auto min-h-11 p-0 md:min-h-0"
          onClick={() => workspace.showTab("studio")}
        >
          {tq("open")}
        </Button>
      )}
    </p>
  )
}
