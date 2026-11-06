"use client"

import type { ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { myHref, uploadMaterialHref } from "../utils/hrefs"
import { UploadReviewNote } from "./upload-review-note"

/**
 * An item the owner can no longer change (rejected, removed, or not editable for another reason): the reviewer's
 * reason and message stay readable, and the next step is a new upload.
 */
export function NotEditablePanel({ item }: { item: ItemDetail }) {
  const t = useT("library.upload.notEditable")
  const status = useT("library.item.status")
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <UploadReviewNote reason={item.status_reason} message={item.status_note} />
      <StateView
        state="empty"
        icon={<Icons.lock aria-hidden />}
        title={t("title")}
        description={t("text", { title: item.title, status: status(item.status) })}
        action={
          <>
            <Link href={uploadMaterialHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
              {t("newUpload")}
            </Link>
            <Link
              href={myHref("uploads")}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              {t("myUploads")}
            </Link>
          </>
        }
      />
    </div>
  )
}
