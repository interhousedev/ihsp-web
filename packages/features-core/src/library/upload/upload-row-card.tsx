"use client"

import { keys, postMaterialSubmit, type UploadRow } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants } from "@ihsp/ui"
import { IconPencil, IconSend } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"
import { ItemCardView } from "../catalog/item-card"
import { uploadEditHref } from "../utils/hrefs"
import { UploadReviewNote } from "./upload-review-note"
import { UploadStatusBadge } from "./upload-status-badge"

/** Statuses in which the owner may open the edit page (title, description, topics at any time; files while open). */
export const EDITABLE_STATUSES = ["draft", "pending_review", "changes_requested", "published", "held"]

/**
 * One upload in "My uploads": the card, the status chip, the place in the review queue, the reviewer's reason and
 * message, and the actions that fit the status: **Edit**, **Resubmit** (after changes were requested) and
 * **Withdraw** (delete, for a draft).
 */
export function UploadRowCard({ row, onWithdraw }: { row: UploadRow; onWithdraw: (row: UploadRow) => void }) {
  const t = useT("library.myUploads")
  const item = useT("library.item")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const id = row.item.id
  const resubmit = useMutation({
    mutationFn: () => postMaterialSubmit(id!),
    onSuccess: () => {
      toast.success(t("resubmitted"))
      void queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })

  const editable = id !== null && EDITABLE_STATUSES.includes(row.status)
  const footer = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <UploadStatusBadge status={row.status} />
        {row.status === "pending_review" && row.queue_position ? (
          <span className="text-muted-foreground text-xs">{t("queuePosition", { position: row.queue_position })}</span>
        ) : null}
      </div>
      <UploadReviewNote reason={row.reason} message={row.review_message} />
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={uploadEditHref(id)}
            aria-label={t("editNamed", { title: row.item.title })}
            className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
          >
            <IconPencil aria-hidden />
            {item("edit")}
          </Link>
          {row.status === "changes_requested" ? (
            <Button
              type="button"
              className="min-h-11 md:min-h-8"
              disabled={resubmit.isPending}
              aria-label={t("resubmitNamed", { title: row.item.title })}
              onClick={() => resubmit.mutate()}
            >
              <IconSend aria-hidden />
              {t("resubmit")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="text-destructive min-h-11 md:min-h-8"
            aria-label={t(row.status === "draft" ? "deleteNamed" : "withdrawNamed", { title: row.item.title })}
            onClick={() => onWithdraw(row)}
          >
            {row.status === "draft" ? t("deleteDraft") : item("withdraw")}
          </Button>
        </div>
      ) : null}
      {resubmit.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(resubmit.error)}
        </p>
      ) : null}
    </div>
  )
  return <ItemCardView item={row.item} layout="list" footer={footer} />
}
