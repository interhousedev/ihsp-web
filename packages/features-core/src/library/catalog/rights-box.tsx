"use client"

import type { ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconScale } from "@tabler/icons-react"
import { RightsBadge } from "./rights-badge"

/** The rights box of a book page: class, the statement, attribution and what the reader may do with the file. */
export function RightsBox({ item }: { item: Pick<ItemDetail, "book" | "rights_box" | "visibility"> }) {
  const t = useT("library.rights")
  const { book, rights_box: box } = item
  if (!book && !box) return null
  const download = box?.download_allowed ?? book?.download_allowed ?? false
  return (
    <section
      aria-labelledby="rights-box-title"
      className="bg-muted/40 flex flex-col gap-2 rounded-xl border p-4 text-sm"
    >
      <h2 id="rights-box-title" className="flex items-center gap-2 font-semibold">
        <IconScale className="size-4" aria-hidden />
        {t("title")}
      </h2>
      {book ? <RightsBadge rights={book.rights} licence={book.licence} /> : null}
      {box?.text ? <p>{box.text}</p> : null}
      {box?.attribution ? (
        <p className="text-muted-foreground">
          <span className="font-medium">{t("attribution")}:</span> {box.attribution}
        </p>
      ) : null}
      <p className="text-muted-foreground">{download ? t("downloadAllowed") : t("downloadDenied")}</p>
      {item.visibility === "lyceum" ? <p className="text-muted-foreground">{t("lyceumOnly")}</p> : null}
    </section>
  )
}
