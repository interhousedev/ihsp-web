"use client"

import { getLibraryFileUrl, type ItemDetail, type ItemFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants, safeHttpUrl } from "@ihsp/ui"
import { IconBook, IconDownload, IconFlag } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useLibraryAccess } from "../hooks/use-library-access"
import { readHref } from "../utils/hrefs"
import { AddToNotebookButton } from "./add-to-notebook"
import { ReportDialog } from "./report-dialog"
import { ShareLink } from "./share-link"
import { ShelfButton } from "./shelf-button"
import { SignInLink } from "./sign-in-link"

/** The file the reader opens: the primary readable one, else any readable one. */
export function primaryFile(item: Pick<ItemDetail, "files">): ItemFile | undefined {
  return item.files.find((file) => file.is_primary && file.readable) ?? item.files.find((file) => file.readable)
}

/**
 * Actions of a book or material: **Read**, Add to shelf, Add to notebook (whole item or a chapter range), Download
 * (when allowed), Share and Report. Signed-out visitors get a Sign in button where an account is needed.
 */
export function ItemActions({ item }: { item: ItemDetail }) {
  const t = useT("library.item")
  const errorMessage = useErrorMessage()
  const { signedIn, status } = useLibraryAccess()
  const [reporting, setReporting] = useState(false)
  const file = primaryFile(item)
  const id = item.id

  const download = useMutation({
    mutationFn: () => getLibraryFileUrl(id!, file!.id),
    onSuccess: (target) => {
      const url = safeHttpUrl(target.url)
      if (url) window.location.assign(url)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  if (!id) return null

  const canRead = item.can.read && file !== undefined
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canRead ? (
        <Link
          href={readHref({ item: id, file: file.id })}
          className={buttonVariants({ className: "min-h-11 md:min-h-8" })}
        >
          <IconBook aria-hidden />
          {t("read")}
        </Link>
      ) : status === "anonymous" ? (
        <SignInLink label={t("signInToRead")} variant="default" />
      ) : null}
      <ShelfButton item={item} />
      {item.can.add_to_notebook && file ? (
        <AddToNotebookButton
          itemId={id}
          fileId={file.id}
          title={item.title}
          pageCount={file.pages}
          noText={file.text_status === "no_text"}
          toc={file.toc}
        />
      ) : null}
      {item.can.download && file ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={download.isPending}
          onClick={() => download.mutate()}
        >
          <IconDownload aria-hidden />
          {t("download")}
        </Button>
      ) : null}
      <ShareLink id={id} slug={item.slug} />
      {signedIn && item.can.report ? (
        <>
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={() => setReporting(true)}>
            <IconFlag aria-hidden />
            {t("report")}
          </Button>
          <ReportDialog itemId={id} open={reporting} onOpenChange={setReporting} />
        </>
      ) : null}
    </div>
  )
}
