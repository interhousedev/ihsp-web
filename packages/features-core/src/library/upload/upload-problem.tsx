"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Icons, buttonVariants, formatBytes } from "@ihsp/ui"
import Link from "next/link"
import { useRejectReason } from "../../file-upload-button/use-reject-reason"
import { itemHref, myHref } from "../utils/hrefs"
import { UploadRejectedError } from "./save-material"
import { classifyUploadError, numberParam, stringParam } from "./upload-errors"
import type { UploadLimits } from "./upload-config"

/**
 * Explains a failed save or submit. A duplicate links to the item that is already in the library, a file that is too
 * large or has too many pages names the limit of the role, a refused file gives the reason of the storage check, and
 * everything else uses the shared message of the error type. (A ban and a used-up daily limit are shown by
 * `UploadBlocked` instead.)
 */
export function UploadProblem({ error, limits }: { error: unknown; limits: UploadLimits }) {
  const t = useT("library.upload.problem")
  const errorMessage = useErrorMessage()
  const rejectReason = useRejectReason()
  const kind = classifyUploadError(error)

  let title = t("title")
  let text = errorMessage(error)
  let action: { href: string; label: string } | null = null
  if (kind === "duplicate") {
    title = t("duplicateTitle")
    text = t("duplicateText")
    const existing = stringParam(error, "item_id")
    if (existing) action = { href: itemHref(existing), label: t("openExisting") }
  } else if (kind === "file-too-large") {
    title = t("tooLargeTitle")
    text = t("tooLargeText", { size: formatBytes(limits.bytes) })
  } else if (kind === "too-many-pages") {
    const pages = numberParam(error, "limit") ?? limits.pages
    title = t("tooManyPagesTitle")
    text = pages ? t("tooManyPagesText", { pages }) : errorMessage(error)
  } else if (kind === "not-editable") {
    title = t("notEditableTitle")
    text = t("notEditableText")
    action = { href: myHref("uploads"), label: t("myUploads") }
  } else if (kind === "rejected" && error instanceof UploadRejectedError) {
    title = t("rejectedTitle")
    text = t("rejectedText", { reason: rejectReason(error.reason) })
  }

  return (
    <Alert variant="destructive" data-error-kind={kind}>
      <Icons.alertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <span>{text}</span>
        {action ? (
          <Link href={action.href} className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}>
            {action.label}
          </Link>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
