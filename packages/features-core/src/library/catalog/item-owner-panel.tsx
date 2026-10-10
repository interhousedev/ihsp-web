"use client"

import { useReasonText } from "../upload/reason-text"
import { deleteMaterial, type ItemDetail } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, ConfirmDialog, buttonVariants } from "@ihsp/ui"
import { IconPencil } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { uploadEditHref } from "../utils/hrefs"

/**
 * The owner's box on their own material: status, the reviewer's reason and message, **Edit** and **Withdraw**.
 * Shown only when the API says the caller may edit the item.
 */
export function ItemOwnerPanel({ item }: { item: ItemDetail }) {
  const t = useT("library.item")
  const reasonText = useReasonText()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const withdraw = useMutation({
    mutationFn: () => deleteMaterial(item.id!),
    onSuccess: () => {
      setConfirming(false)
      toast.success(t("withdrawn"))
      void queryClient.invalidateQueries({ queryKey: ["library"] })
    },
  })
  if (item.kind !== "material" || !item.can.edit || !item.id) return null
  return (
    <section
      aria-labelledby="owner-panel-title"
      className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 text-sm"
    >
      <h2 id="owner-panel-title" className="font-semibold">
        {t("ownerPanel")}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">{t("status.label")}:</span>
        <Badge variant="secondary">{t(`status.${item.status}`)}</Badge>
      </div>
      {item.status_reason ? (
        <p>
          <span className="font-medium">{t("reason")}:</span> {reasonText(item.status_reason)}
        </p>
      ) : null}
      {item.status_note ? (
        <p>
          <span className="font-medium">{t("reviewerMessage")}:</span> {item.status_note}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link
          href={uploadEditHref(item.id)}
          className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
        >
          <IconPencil aria-hidden />
          {t("edit")}
        </Link>
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", className: "text-destructive min-h-11 md:min-h-8" })}
          onClick={() => setConfirming(true)}
        >
          {t("withdraw")}
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("withdrawConfirmTitle")}
        description={t("withdrawConfirmText")}
        confirmLabel={t("withdraw")}
        destructive
        loading={withdraw.isPending}
        onConfirm={() => withdraw.mutate()}
      >
        {withdraw.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(withdraw.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  )
}
