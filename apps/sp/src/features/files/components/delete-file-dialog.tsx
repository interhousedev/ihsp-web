"use client"

import type { FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, ConfirmDialog } from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { toast } from "sonner"
import { useDeleteFile } from "../hooks/use-my-files"
import { UsedByList } from "./used-by-list"

type DeleteFileDialogProps = { file: FileItem | null; onClose: () => void }

/** Confirms the deletion and, when the file is used, lists what will stop working (UF-WEB-18 4a). */
export function DeleteFileDialog({ file, onClose }: DeleteFileDialogProps) {
  const t = useT("files.delete")
  const errorMessage = useErrorMessage()
  const remove = useDeleteFile()

  return (
    <ConfirmDialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) {
          remove.reset()
          onClose()
        }
      }}
      title={t("title")}
      description={file ? t("description", { name: file.name }) : undefined}
      confirmLabel={t("confirm")}
      destructive
      loading={remove.isPending}
      onConfirm={() => {
        if (!file) return
        remove.mutate(file.id, {
          onSuccess: () => {
            toast.success(t("deleted", { name: file.name }))
            onClose()
          },
        })
      }}
    >
      {file && file.used_by.length > 0 ? (
        <Alert variant="destructive">
          <IconAlertTriangle aria-hidden />
          <AlertDescription className="flex flex-col gap-2">
            <span>{t("usedWarning")}</span>
            <UsedByList items={file.used_by} />
          </AlertDescription>
        </Alert>
      ) : null}
      {remove.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(remove.error)}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
