"use client"

import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"

/** Asked when the reader closes with drawings that were not saved: save them, drop them, or stay. */
export function MarkupExitDialog({
  open,
  canSave,
  saving,
  onSave,
  onDiscard,
  onStay,
}: {
  open: boolean
  canSave: boolean
  saving: boolean
  onSave(): void
  onDiscard(): void
  onStay(): void
}) {
  const t = useT("library.reader")
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay()
      }}
      title={t("markupExitTitle")}
      description={canSave ? t("markupExitBody") : t("markupExitVisitor")}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onStay}>
            {t("markupStay")}
          </Button>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onDiscard}>
            {t("markupDiscard")}
          </Button>
          {canSave ? (
            <Button type="button" disabled={saving} className="min-h-11 md:min-h-8" onClick={onSave}>
              {t("markupSave")}
            </Button>
          ) : null}
        </>
      }
    >
      <span className="sr-only">{t("markupExitTitle")}</span>
    </ResponsiveDialog>
  )
}
