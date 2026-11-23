"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Pill } from "@ihsp/ui"
import type { ReactNode } from "react"
import type { CatalogEntry } from "../api"

/** A course or book with its cover, title and a link to the LMS or the library. */
export function CatalogCard({ entry, action }: { entry: CatalogEntry; action?: ReactNode }) {
  const t = useT("courses")
  return (
    <li className="flex gap-3 rounded-card border p-3">
      {entry.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.cover_url} alt="" loading="lazy" className="h-24 w-16 shrink-0 rounded object-cover" />
      ) : (
        <div aria-hidden className="bg-muted flex h-24 w-16 shrink-0 items-center justify-center rounded">
          <Icons.courses className="text-muted-foreground size-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={entry.kind === "course" ? "primary" : "neutral"}>{t(`catalog.kind.${entry.kind}`)}</Pill>
          {entry.enrolled ? <Pill tone="success">{t("catalog.enrolled")}</Pill> : null}
        </div>
        <p className="font-medium break-words">{entry.title}</p>
        {entry.summary ? <p className="text-muted-foreground line-clamp-2 text-sm">{entry.summary}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex min-h-9 items-center gap-1 text-sm underline-offset-2 hover:underline"
          >
            {t(entry.kind === "course" ? "catalog.openCourse" : "catalog.openBook")}
            <Icons.externalLink aria-hidden className="size-4" />
          </a>
          {action}
        </div>
      </div>
    </li>
  )
}
