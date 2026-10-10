"use client"

import { keys, type ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, cn } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { createElement, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  useCancelArtifact,
  useDeleteArtifact,
  useRetryArtifact,
  useSaveArtifactAsSource,
  useSaveFlashcardSet,
} from "../api/use-artifacts"
import { artifactIcon } from "../lib/artifact-kinds"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { useWorkspace } from "../workspace-context"
import { ItemMenu } from "./item-menu"
import { ItemStatus } from "./item-status"
import { RenameArtifactDialog } from "./rename-artifact-dialog"
import { useKindLabel } from "./use-kind-label"
import { ViewPromptDialog } from "./view-prompt-dialog"

export type StudioItemProps = {
  item: ArtifactItem
  notebookId: string
}

type ItemDialog = "rename" | "prompt" | "delete" | null

/** One row of the Studio list: icon, title, state line, and the ⋮ menu. A ready item opens its viewer on click. */
export function StudioItem({ item, notebookId }: StudioItemProps) {
  const t = useT("notebooks")
  const workspace = useWorkspace()
  const queryClient = useQueryClient()
  const errorMessage = useNotebookErrorMessage()
  const kindLabel = useKindLabel()
  const [dialog, setDialog] = useState<ItemDialog>(null)

  const retry = useRetryArtifact(notebookId)
  const cancel = useCancelArtifact(notebookId)
  const remove = useDeleteArtifact(notebookId)
  const addAsSource = useSaveArtifactAsSource(notebookId)
  const saveSet = useSaveFlashcardSet(notebookId)

  const fallback = kindLabel(item)
  const title = item.title || fallback
  const ready = item.status === "ready"
  const unread = ready && item.unread
  const fail = (error: unknown) => toast.error(errorMessage(error))
  const close = () => setDialog(null)

  const open = () => {
    // The server marks the item viewed when the viewer loads it; the list shows that at once.
    if (item.unread) {
      queryClient.setQueryData<ArtifactItem[]>(keys.notebooks.artifacts(notebookId), (items) =>
        items?.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)),
      )
    }
    workspace.openArtifact(item.id)
  }

  const body: ReactNode = (
    <>
      <span
        className={cn(
          "bg-muted text-muted-foreground relative flex size-9 shrink-0 items-center justify-center rounded-lg",
          item.status === "failed" && "text-destructive",
        )}
      >
        {createElement(artifactIcon(item), {
          className: "size-5",
          "aria-hidden": true,
        })}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{title}</span>
          {unread ? (
            <>
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
              <span className="sr-only">{t("item.new")}</span>
            </>
          ) : null}
        </span>
        <ItemStatus item={item} />
      </span>
    </>
  )

  return (
    <li className="hover:bg-muted/50 flex items-center gap-1 rounded-lg">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
        {ready ? (
          <button
            type="button"
            className="focus-visible:ring-ring/50 flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-start outline-none focus-visible:ring-3"
            onClick={open}
          >
            {body}
          </button>
        ) : (
          <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 p-2">{body}</div>
        )}
        {item.status === "failed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mx-2 min-h-11 md:min-h-8"
            disabled={retry.isPending}
            onClick={() => retry.mutate(item.id, { onError: fail })}
          >
            {t("item.retry")}
          </Button>
        ) : null}
      </div>
      <ItemMenu
        notebookId={notebookId}
        item={item}
        title={title}
        onRename={() => setDialog("rename")}
        onViewPrompt={() => setDialog("prompt")}
        onAddAsSource={() =>
          addAsSource.mutate(item.id, {
            onSuccess: () => toast.success(t("studio.addedAsSource")),
            onError: fail,
          })
        }
        onSaveSet={() =>
          saveSet.mutate(item.id, {
            onSuccess: () => toast.success(t("studio.setSaved")),
            onError: fail,
          })
        }
        onCancel={() => cancel.mutate(item.id, { onError: fail })}
        onDelete={() => setDialog("delete")}
      />
      {dialog === "rename" ? (
        <RenameArtifactDialog
          notebookId={notebookId}
          item={item}
          fallbackTitle={fallback}
          open
          onOpenChange={(next) => !next && close()}
        />
      ) : null}
      {dialog === "prompt" ? <ViewPromptDialog item={item} open onOpenChange={(next) => !next && close()} /> : null}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(next) => !next && close()}
        title={t("studio.deleteTitle")}
        description={t("studio.deleteDescription")}
        confirmLabel={t("studio.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate(item.id, { onSuccess: close, onError: fail })}
      />
    </li>
  )
}
