"use client"

import type { BookAction, ItemStatus } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { IconDeviceFloppy, IconEyeOff, IconSend, IconTrashX } from "@tabler/icons-react"
import { useState } from "react"
import { ReasonDialog } from "../shared/reason-dialog"

/**
 * The bar under the form: **Save** with the "Unsaved changes" indicator, and the actions the state allows: **Publish**
 * (draft, unpublished), **Unpublish** and **Take down** (published; Take down asks for a reason that is kept).
 * Publish waits for a saved form: the API checks the saved book.
 */
export function BookActions({
  status,
  isNew,
  dirty,
  blocked,
  saving,
  acting,
  saveError,
  problem,
  onSave,
  onAction,
}: {
  status: ItemStatus | null
  isNew: boolean
  dirty: boolean
  /** The form has problems the API would refuse. */
  blocked: boolean
  saving: boolean
  acting: boolean
  saveError: unknown
  /** The text of a failed action (not the rights checklist, which has its own place). */
  problem: string | null
  onSave: () => void
  onAction: (action: BookAction, reason?: string) => void
}) {
  const t = useT("library.manage.editor")
  const errorMessage = useErrorMessage()
  const [takingDown, setTakingDown] = useState(false)
  const canPublish = !isNew && (status === "draft" || status === "unpublished" || status === "held")
  const published = status === "published"

  return (
    <div className="bg-background sticky bottom-[calc(var(--bottom-nav-height,0px)+var(--safe-bottom,0px))] z-10 flex flex-col gap-2 border-t py-3 md:bottom-0">
      <div aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm">
        {dirty ? (
          <Badge variant="secondary" className="h-6 px-3">
            {t("unsavedChanges")}
          </Badge>
        ) : status ? (
          <span className="text-muted-foreground">{t("allSaved")}</span>
        ) : null}
        {canPublish && dirty ? <span className="text-muted-foreground text-xs">{t("saveBeforePublish")}</span> : null}
      </div>
      {saveError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(saveError)}
        </p>
      ) : null}
      {problem ? (
        <p role="alert" className="text-destructive text-sm">
          {problem}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-11 md:min-h-8"
          disabled={saving || acting || blocked || (!dirty && !isNew)}
          onClick={onSave}
        >
          <IconDeviceFloppy aria-hidden />
          {isNew ? t("create") : t("save")}
        </Button>
        {canPublish ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={saving || acting || dirty || blocked}
            onClick={() => onAction("publish")}
          >
            <IconSend aria-hidden />
            {t("publish")}
          </Button>
        ) : null}
        {published ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              disabled={saving || acting}
              onClick={() => onAction("unpublish")}
            >
              <IconEyeOff aria-hidden />
              {t("unpublish")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 md:min-h-8"
              disabled={saving || acting}
              onClick={() => setTakingDown(true)}
            >
              <IconTrashX aria-hidden />
              {t("takedown")}
            </Button>
          </>
        ) : null}
      </div>
      <ReasonDialog
        open={takingDown}
        onOpenChange={setTakingDown}
        title={t("takedownTitle")}
        description={t("takedownDescription")}
        confirmLabel={t("takedown")}
        destructive
        pending={acting}
        onSubmit={(reason) => {
          onAction("takedown", reason)
          setTakingDown(false)
        }}
      />
    </div>
  )
}
