"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"

type SaveBarProps = {
  dirty: boolean
  saving: boolean
  error: unknown
  onSave: () => void
  onDiscard: () => void
}

/** The dirty indicator, Save (PUT slides) and Discard, with the error of a failed save. */
export function SaveBar({ dirty, saving, error, onSave, onDiscard }: SaveBarProps) {
  const t = useT("notebooks.slides")
  const tCommon = useT("common")
  const errorMessage = useNotebookErrorMessage()
  return (
    <div className="bg-card sticky bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border p-2 shadow-sm">
      <p
        role="status"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
        data-dirty={dirty ? "true" : "false"}
      >
        {dirty ? (
          <>
            <span aria-hidden className="bg-primary size-2 shrink-0 rounded-full" />
            {t("unsaved")}
          </>
        ) : (
          <>
            <Icons.check className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <span className="text-muted-foreground">{t("saved")}</span>
          </>
        )}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 md:min-h-8"
        disabled={!dirty || saving}
        onClick={onDiscard}
      >
        {t("discard")}
      </Button>
      <Button type="button" className="min-h-11 md:min-h-8" disabled={!dirty || saving} onClick={onSave}>
        {saving ? <Icons.spinner className="animate-spin" aria-hidden /> : null}
        {saving ? tCommon("saving") : tCommon("save")}
      </Button>
      {error ? (
        <p role="alert" className="text-destructive w-full text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  )
}
