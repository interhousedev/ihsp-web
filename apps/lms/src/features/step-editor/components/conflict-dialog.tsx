"use client"

import type { StepContent, StepDraft } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ihsp/ui"
import { StepDiffView } from "../../shared/components/step-diff-view"
import { personName } from "../../shared/utils/people"

/**
 * The second save of a step was refused (LMS-13, UF-LMS-08 3a): both versions side by side with Keep mine, Take theirs,
 * or close to copy parts by hand (the conflict stays until one of the two is chosen).
 */
export function ConflictDialog({
  open,
  onOpenChange,
  mine,
  theirs,
  onKeepMine,
  onTakeTheirs,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mine: StepContent
  theirs: StepDraft
  onKeepMine: () => void
  onTakeTheirs: () => void
}) {
  const t = useT("conflict")
  const format = useFormatters()
  const who =
    theirs.updated_via === "mcp" ? t("mcpClient") : theirs.updated_by ? personName(theirs.updated_by) : t("someone")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {theirs.updated_at
              ? t("description", { who, time: format.dateTime(theirs.updated_at) })
              : t("descriptionNoTime", { who })}
          </DialogDescription>
        </DialogHeader>
        <StepDiffView live={theirs.content} draft={mine} liveLabel={t("theirs")} draftLabel={t("mine")} />
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
            {t("copyByHand")}
          </Button>
          <Button variant="outline" onClick={onTakeTheirs} className="min-h-11 md:min-h-8">
            {t("takeTheirs")}
          </Button>
          <Button onClick={onKeepMine} className="min-h-11 md:min-h-8">
            {t("keepMine")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
