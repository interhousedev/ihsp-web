"use client"

import { type ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { DropdownMenuItem, DropdownMenuSeparator } from "@ihsp/ui"
import { exportFormat } from "./document-format"
import { useArtifactExport } from "./use-artifact-export"

type ArtifactExportItemsProps = {
  notebookId: string
  item: Pick<ArtifactItem, "id" | "kind" | "status"> & { title: string }
}

const ITEM_CLASS = "min-h-11 md:min-h-8"

/** Download, Share and Add to my files for a ready output: put inside a `DropdownMenuContent`. */
export function ArtifactExportItems({ notebookId, item }: ArtifactExportItemsProps) {
  const t = useT("notebooks")
  const actions = useArtifactExport(notebookId)
  const format = exportFormat(item.kind)
  if (item.status !== "ready" || !format) return null
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem className={ITEM_CLASS} onClick={() => void actions.download(item)}>
        {t("export.download", { format })}
      </DropdownMenuItem>
      <DropdownMenuItem className={ITEM_CLASS} onClick={() => void actions.share(item)}>
        {t("export.share")}
      </DropdownMenuItem>
      <DropdownMenuItem className={ITEM_CLASS} onClick={() => void actions.saveToFiles(item)}>
        {t("export.addToFiles")}
      </DropdownMenuItem>
    </>
  )
}
