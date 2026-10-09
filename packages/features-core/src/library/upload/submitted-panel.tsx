"use client"

import type { ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  buttonVariants,
} from "@ihsp/ui"
import Link from "next/link"
import { itemHref, myHref } from "../utils/hrefs"
import { SubmitNote } from "./step-review"

/** After Submit: published at once (teachers) or waiting for a librarian (students), with the next steps. */
export function SubmittedPanel({ item, onAnother }: { item: ItemDetail; onAnother?: () => void }) {
  const t = useT("library.upload.done")
  const published = item.status === "published"
  return (
    <Empty className="border" role="status" data-status={item.status}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.circleCheck aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{published ? t("publishedTitle") : t("reviewTitle")}</EmptyTitle>
        <EmptyDescription>{item.title}</EmptyDescription>
        <EmptyDescription>{published ? t("publishedText") : <SubmitNote className="contents" />}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center gap-2">
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
      </EmptyContent>
    </Empty>
  )
}
