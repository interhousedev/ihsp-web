"use client"

import { getLibraryFileUrl, type ItemDetail, type ItemFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants } from "@ihsp/ui"
import { IconDownload, IconFlag, IconInfoCircle } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"
import { AddToNotebookButton, ShareLink, ShelfButton } from "../catalog"
import { itemHref } from "../utils/hrefs"
import { ReaderSheet } from "./reader-sheet"
import { tocFromFile } from "./reader-types"

/**
 * The reader's menu: Add to shelf, Add to notebook, Share link, Download (when the item allows it) and Report, all
 * the same pieces as the item page. A sheet rather than a dropdown, because the dialogs some of them open must outlive
 * the menu's items.
 */
export function ReaderMenu({
  open,
  onOpenChange,
  item,
  file,
  signedIn,
  onReport,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  item: ItemDetail
  file: ItemFile
  signedIn: boolean
  onReport(): void
}) {
  const t = useT("library.reader")
  const itemT = useT("library.item")
  const errorMessage = useErrorMessage()
  const id = item.id

  const download = useMutation({
    mutationFn: () => getLibraryFileUrl(id!, file.id),
    onSuccess: (target) => window.location.assign(target.url),
    onError: (error) => toast.error(errorMessage(error)),
  })
  if (!id) return null

  return (
    <ReaderSheet open={open} onOpenChange={onOpenChange} title={t("menu")}>
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-2 overflow-y-auto p-4 [&>*]:justify-start">
        <Link href={itemHref(id)} className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}>
          <IconInfoCircle aria-hidden />
          {t("itemPage")}
        </Link>
        <ShelfButton item={item} className="w-full justify-between" />
        {item.can.add_to_notebook ? (
          <AddToNotebookButton
            itemId={id}
            fileId={file.id}
            title={item.title}
            pageCount={file.pages}
            noText={file.text_status === "no_text"}
            toc={tocFromFile(file.toc).map((entry) => ({
              title: entry.title,
              level: entry.level,
              ...(entry.page === null ? {} : { page: entry.page }),
            }))}
            className="w-full justify-start"
          />
        ) : null}
        <ShareLink id={id} slug={item.slug} />
        {item.can.download ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={download.isPending}
            onClick={() => download.mutate()}
          >
            <IconDownload aria-hidden />
            {itemT("download")}
          </Button>
        ) : null}
        {signedIn && item.can.report ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 md:min-h-8"
            onClick={() => {
              onOpenChange(false)
              onReport()
            }}
          >
            <IconFlag aria-hidden />
            {itemT("report")}
          </Button>
        ) : null}
      </div>
    </ReaderSheet>
  )
}
