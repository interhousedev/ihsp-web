"use client"

import { useT } from "@ihsp/i18n"
import { ConfirmDialog } from "@ihsp/ui"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { RenameSourceDialog } from "./rename-source-dialog"
import type { SourceActions } from "./use-source-actions"

/** The rename dialog and the remove confirmation driven by `useSourceActions`. */
export function SourceActionDialogs({ actions }: { actions: SourceActions }) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const { removing } = actions
  return (
    <>
      <RenameSourceDialog
        source={actions.renaming}
        pending={actions.renamePending}
        error={actions.renameError}
        onClose={actions.cancelRename}
        onSave={actions.rename}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && actions.cancelRemove()}
        title={t("remove.title")}
        description={t("remove.description")}
        confirmLabel={t("row.remove")}
        destructive
        loading={actions.removePending}
        onConfirm={() => {
          if (removing) actions.remove(removing)
        }}
      >
        {actions.removeError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(actions.removeError)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
