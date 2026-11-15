"use client"

import { type AdminErasureRequest, keys, postAdminErasureApprove, postAdminErasureReject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

export type ErasureDecision = { request: AdminErasureRequest; kind: "approve" | "reject" }

/** Confirmation of an erasure decision. Approving is irreversible and says so; rejecting takes an optional reason. */
export function ErasureDecisionDialog({ decision, onClose }: { decision: ErasureDecision; onClose: () => void }) {
  const t = useT("erasure")
  const [reason, setReason] = useState("")
  const approving = decision.kind === "approve"
  const who = decision.request.name ?? decision.request.login ?? decision.request.id
  const mutation = useAdminMutation({
    mutationFn: () =>
      approving
        ? postAdminErasureApprove(decision.request.id)
        : postAdminErasureReject(decision.request.id, { reason: reason.trim() || null }),
    invalidate: [keys.privacy.all()],
    success: approving ? t("approved") : t("rejected"),
    onSuccess: onClose,
  })

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t(approving ? "approveTitle" : "rejectTitle", { name: who })}
      description={t(approving ? "approveText" : "rejectText")}
      confirmLabel={t(approving ? "approveAction" : "rejectAction")}
      destructive={approving}
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate()}
    >
      {approving ? null : (
        <div className="grid gap-2">
          <Label htmlFor="erasure-reason">{t("reason")}</Label>
          <Textarea
            id="erasure-reason"
            value={reason}
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      )}
    </ConfirmDialog>
  )
}
