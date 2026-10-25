"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ihsp/ui"
import { useArtifact } from "../api/use-artifacts"
import { BlueprintPlan } from "./blueprint-plan"
import { optionLines } from "./option-lines"
import { useKindLabel } from "./use-kind-label"

export type ViewPromptDialogProps = {
  item: ArtifactItem
  notebookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "View prompt": what the student asked for (the type, the options and the focus text). The system prompt of the
 * service is never shown.
 */
export function ViewPromptDialog({ item, notebookId, open, onOpenChange }: ViewPromptDialogProps) {
  const t = useT("notebooks")
  const kindLabel = useKindLabel()
  const lines = optionLines(item)
  const planned = item.kind === "quiz" || item.kind === "flashcards"
  // The plan lives in the content: only the kinds that have one load the detail (the server marks it viewed).
  const detail = useArtifact(notebookId, planned ? item.id : null)
  const blueprint =
    detail.data && (detail.data.kind === "quiz" || detail.data.kind === "flashcards")
      ? detail.data.content?.blueprint
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pe-8">
          <DialogTitle>{t("studio.promptTitle")}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t("studio.promptType")}</dt>
          <dd>{kindLabel(item)}</dd>
          {lines.map((entry) => (
            <div key={entry.labelKey} className="contents">
              <dt className="text-muted-foreground">{t(entry.labelKey)}</dt>
              <dd>{entry.valueKeys ? entry.valueKeys.map((key) => t(key)).join(", ") : entry.text}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1">
          <h3 className="text-muted-foreground text-sm">{t("studio.promptFocus")}</h3>
          <p className="bg-muted/50 rounded-lg p-3 text-sm break-words whitespace-pre-wrap">
            {item.prompt ? item.prompt : t("studio.promptNoFocus")}
          </p>
        </div>
        {blueprint ? <BlueprintPlan blueprint={blueprint} /> : null}
      </DialogContent>
    </Dialog>
  )
}
