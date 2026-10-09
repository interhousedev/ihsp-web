"use client"

import type { ModerationAction } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ReasonDialog } from "../shared/reason-dialog"

/** The actions that open a reason dialog (approve runs at once). */
export type ReasonedAction = Exclude<ModerationAction, "approve">

/**
 * The reason dialog of a moderation action: request changes, reject, hold, unpublish, restore. The reason is required
 * and the owner sees it. The dialog stays open with the server's message when the request fails.
 */
export function ModerationDialog({
  action,
  title,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  /** `null` while no dialog is open. */
  action: ReasonedAction | null
  /** The title of the item, named in the dialog description. */
  title: string
  pending: boolean
  error: unknown
  onSubmit: (action: ReasonedAction, reason: string) => void
  onClose: () => void
}) {
  const t = useT("library.manage.queue.dialog")
  const shown = action ?? "reject"
  return (
    <ReasonDialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={t(`${shown}.title`)}
      description={t(`${shown}.description`, { title })}
      confirmLabel={t(`${shown}.confirm`)}
      destructive={shown === "reject" || shown === "unpublish"}
      pending={pending}
      error={error}
      onSubmit={(reason) => {
        if (action) onSubmit(action, reason)
      }}
    />
  )
}
