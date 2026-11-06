"use client"

import type { ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { itemHref, myHref } from "../utils/hrefs"
import { SubmitNote } from "./step-review"

/** After Submit: published at once (teachers) or waiting for a librarian (students), with the next steps. */
export function SubmittedPanel({ item, onAnother }: { item: ItemDetail; onAnother?: () => void }) {
  const t = useT("library.upload.done")
  const published = item.status === "published"
  return (
    <StateView
      state="empty"
      data-status={item.status}
      icon={<Icons.circleCheck aria-hidden />}
      title={published ? t("publishedTitle") : t("reviewTitle")}
      description={
        <>
          <div>{item.title}</div>
          <div>{published ? t("publishedText") : <SubmitNote className="contents" />}</div>
        </>
      }
      action={
        <>
          {published && item.id ? (
            <Link href={itemHref(item.id)} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
              {t("view")}
            </Link>
          ) : null}
          <Link
            href={myHref("uploads")}
            className={buttonVariants({ variant: published ? "outline" : "default", className: "min-h-11 md:min-h-8" })}
          >
            {t("myUploads")}
          </Link>
          {onAnother ? (
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onAnother}>
              {t("another")}
            </Button>
          ) : null}
        </>
      }
    />
  )
}
