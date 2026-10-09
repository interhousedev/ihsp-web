"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ihsp/ui"
import { optionLines } from "./option-lines"
import { useKindLabel } from "./use-kind-label"

export type ViewPromptDialogProps = {
  item: ArtifactItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "View prompt": what the student asked for (the type, the options and the focus text). The system prompt of the
 * service is never shown.
 */
export function ViewPromptDialog({ item, open, onOpenChange }: ViewPromptDialogProps) {
  const t = useT("notebooks")
  const kindLabel = useKindLabel()
  const lines = optionLines(item)

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
      </DialogContent>
    </Dialog>
  )
}
