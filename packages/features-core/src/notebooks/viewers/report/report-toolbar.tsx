"use client"

import type { ArtifactDetail, ReportContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconCheck, IconCopy, IconDownload, IconFilePlus, IconPrinter } from "@tabler/icons-react"
import { toast } from "sonner"
import { useSaveArtifactAsSource } from "../../api/use-artifacts"
import { markersToBrackets } from "../../lib/citations"
import { downloadText, fileNameFor } from "../../lib/download"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { ToolbarButton } from "../toolbar-button"
import { useCopy } from "../use-copy"

type ReportToolbarProps = {
  notebookId: string
  artifact: Extract<ArtifactDetail, { kind: "report" }>
  content: ReportContent
}

/** Copy, Download .md, Print / PDF and Add as source. Everything here is hidden when the report is printed. */
export function ReportToolbar({ notebookId, artifact, content }: ReportToolbarProps) {
  const t = useT("notebooks")
  const common = useT()
  const copy = useCopy()
  const errorMessage = useNotebookErrorMessage()
  const addAsSource = useSaveArtifactAsSource(notebookId)
  // Citation markers become [1][2] in everything that leaves the app.
  const text = markersToBrackets(content.markdown)
  const added = addAsSource.isSuccess

  return (
    <div className="mb-4 flex flex-col gap-2 print:hidden">
      <div role="group" aria-label={t("viewers.report.toolbar")} className="flex flex-wrap gap-2">
        <ToolbarButton icon={IconCopy} label={common("common.copy")} onClick={() => void copy(text)} />
        <ToolbarButton
          icon={IconDownload}
          label={t("report.downloadMd")}
          onClick={() => downloadText(fileNameFor(content.title, "md"), text, "text/markdown;charset=utf-8")}
        />
        <ToolbarButton icon={IconPrinter} label={t("report.print")} onClick={() => window.print()} />
        <ToolbarButton
          icon={added ? IconCheck : IconFilePlus}
          label={t("item.addAsSource")}
          disabled={added || addAsSource.isPending}
          onClick={() =>
            addAsSource.mutate(artifact.id, { onSuccess: () => toast.success(t("viewers.report.sourceAdded")) })
          }
        />
      </div>
      {addAsSource.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(addAsSource.error)}
        </p>
      ) : null}
    </div>
  )
}
