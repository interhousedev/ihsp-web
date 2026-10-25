"use client"

import type { ModerationAction, StatusReasonCode } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ReasonDialog } from "../shared/reason-dialog"

/** The actions that open a reason dialog (approve runs at once). */
export type ReasonedAction = Exclude<ModerationAction, "approve">

/**
 * The system reason codes each action may carry (`StatusReasonCode` of the API). Where none fits (reject, request
 * changes, restore) the librarian writes a short reason in own words; every action also takes a free message.
 */
export const REASON_CODES: Record<ReasonedAction, readonly StatusReasonCode[]> = {
  "request-changes": [],
  reject: [],
  hold: ["reported"],
  unpublish: ["unpublished", "takedown", "superseded"],
  restore: [],
}

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
  onSubmit: (action: ReasonedAction, reason: string, note?: string) => void
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
      codes={REASON_CODES[shown]}
      noteRequired={shown === "request-changes"}
      onSubmit={(reason, note) => {
        if (action) onSubmit(action, reason, note)
      }}
    />
  )
}
