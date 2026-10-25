"use client"

import type { ItemFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { readHref } from "../utils/hrefs"

/** The contents of the primary file: entries with a page link into the reader. */
export function ItemContents({ itemId, file }: { itemId: string; file: ItemFile }) {
  const t = useT("library.item")
  if (file.toc.length === 0) return null
  return (
    <section aria-labelledby="item-contents-title" className="flex flex-col gap-2">
      <h2 id="item-contents-title" className="text-base font-semibold">
        {t("contents")}
      </h2>
      <ol className="flex flex-col text-sm">
        {file.toc.map((entry, index) => {
          const indent = { paddingInlineStart: `${entry.level * 1.25}rem` }
          const label = <span className="min-w-0 flex-1 break-words">{entry.title}</span>
          return (
            <li key={`${entry.title}-${index}`} style={indent}>
              {entry.page !== undefined ? (
                <Link
                  href={readHref({ item: itemId, file: file.id, page: entry.page })}
                  className="hover:bg-muted flex min-h-11 items-center justify-between gap-3 rounded-md px-2 md:min-h-9"
                >
                  {label}
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {t("page", { page: entry.page })}
                  </span>
                </Link>
              ) : (
                <span className="flex min-h-9 items-center px-2">{label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
