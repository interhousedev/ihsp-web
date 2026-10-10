"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconFiles, IconFileUpload } from "@ihsp/ui"
import { FileUploadButton } from "../../file-upload-button"
import { useWorkspace } from "../workspace-context"
import { UploadDropZone } from "./upload-drop-zone"
import { useUploadToNotebook } from "./use-upload-to-notebook"

/** The empty Sources panel: a dashed drop zone that accepts files and offers the two quickest ways to start. */
export function SourcesEmpty({ notebookId }: { notebookId: string }) {
  const t = useT("notebooks")
  const { openAddSources } = useWorkspace()
  const uploader = useUploadToNotebook(notebookId)
  return (
    <UploadDropZone
      uploader={uploader}
      className="border-muted-foreground/30 items-center rounded-xl border-2 border-dashed p-4 text-center"
    >
      <IconFileUpload aria-hidden className="text-muted-foreground size-8" />
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t("sources.empty.title")}</h3>
        <p className="text-muted-foreground text-xs">{t("sources.empty.description")}</p>
        <p className="text-muted-foreground text-xs">{t("add.drop")}</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <FileUploadButton
          purpose="ai_upload"
          multiple
          variant="default"
          label={t("add.upload")}
          onUploaded={(file) => void uploader.addFile(file)}
        />
        <Button type="button" variant="outline" className="min-h-11" onClick={openAddSources}>
          <IconFiles aria-hidden />
          {t("sources.empty.fromFiles")}
        </Button>
      </div>
    </UploadDropZone>
  )
}
