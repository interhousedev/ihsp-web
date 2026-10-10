"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconDotsVertical } from "@ihsp/ui"
import { useState } from "react"
import { useDeleteArtifact } from "../../api/use-artifacts"
import { ArtifactExportItems } from "../../studio/artifact-export-items"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { RenameArtifactDialog } from "./rename-artifact-dialog"

type ItemMenuProps = {
  notebookId: string
  artifactId: string
  title: string
  kind: ArtifactItem["kind"]
  status: ArtifactItem["status"]
  /** Called after the item was deleted (the shell closes the viewer). */
  onDeleted: () => void
}

/** The ⋮ menu of the viewer header: Rename (dialog), Download / Share / Add to my files and Delete (confirmation). */
export function ItemMenu({ notebookId, artifactId, title, kind, status, onDeleted }: ItemMenuProps) {
  const t = useT("notebooks")
  const common = useT()
  const errorMessage = useNotebookErrorMessage()
  const remove = useDeleteArtifact(notebookId)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-11"
              aria-label={common("common.more")}
            />
          }
        >
          <IconDotsVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => setRenaming(true)}>
            {t("card.rename")}
          </DropdownMenuItem>
          <ArtifactExportItems notebookId={notebookId} item={{ id: artifactId, kind, status, title }} />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 md:min-h-8"
            onClick={() => {
              remove.reset()
              setDeleting(true)
            }}
          >
            {t("card.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameArtifactDialog
        notebookId={notebookId}
        artifactId={artifactId}
        title={title}
        open={renaming}
        onOpenChange={setRenaming}
      />

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("viewers.deleteTitle")}
        description={t("viewers.deleteDescription")}
        confirmLabel={t("card.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(artifactId)
          } catch {
            return
          }
          setDeleting(false)
          onDeleted()
        }}
      >
        {remove.error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
