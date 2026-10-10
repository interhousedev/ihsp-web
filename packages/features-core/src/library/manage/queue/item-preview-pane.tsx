"use client"

import { useReasonText } from "../../upload/reason-text"
import { getLibraryItemQuery, type ItemDetail, type ManageQueueRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Skeleton, formatBytes } from "@ihsp/ui"
import { IconAlertTriangle, IconExternalLink, IconUserOff } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import type { ReactNode } from "react"
import { CoverImage } from "../../catalog/cover-image"
import { RightsBadge } from "../../catalog/rights-badge"
import { SourceTag } from "../../catalog/source-tag"
import { itemHref, readHref } from "../../utils/hrefs"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  )
}

function FileList({ detail }: { detail: ItemDetail }) {
  const t = useT("library.manage.queue.preview")
  const status = useT("library.manage.textStatus")
  if (detail.files.length === 0) return <p className="text-muted-foreground text-sm">{t("noFiles")}</p>
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {detail.files.map((file) => (
        <li key={file.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="font-medium uppercase">{file.format}</span>
          {file.pages ? <span>{t("pages", { count: file.pages })}</span> : null}
          <span className="text-muted-foreground">{formatBytes(file.byte_size)}</span>
          <Badge variant={file.text_status === "ready" ? "secondary" : "outline"}>{status(file.text_status)}</Badge>
        </li>
      ))}
    </ul>
  )
}

function SuggestionBlock({ row }: { row: ManageQueueRow }) {
  const t = useT("library.manage.queue.preview")
  const suggestion = row.suggestion
  if (!suggestion) return null
  return (
    <div className="flex flex-col gap-3">
      <Section title={t("suggestedBy")}>
        <p className="text-sm">{suggestion.user_name}</p>
      </Section>
      {suggestion.url ? (
        <Section title={t("suggestionLink")}>
          <a
            href={suggestion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex min-h-11 items-center gap-1 text-sm break-all underline-offset-4 hover:underline md:min-h-8"
          >
            {suggestion.url}
            <IconExternalLink className="size-4 shrink-0" aria-hidden />
          </a>
        </Section>
      ) : null}
      {suggestion.note ? (
        <Section title={t("suggestionNote")}>
          <p className="text-sm break-words whitespace-pre-line">{suggestion.note}</p>
        </Section>
      ) : null}
    </div>
  )
}

/**
 * The right side of the split view: what the librarian needs to decide. For a stored item it loads the detail (files,
 * description, subjects) and shows the scan findings, the uploader with the cohort and the reports from the row; a
 * suggestion shows the title, the link and the note. `needsAnotherLibrarian` shows why Approve is refused.
 */
export function ItemPreviewPane({
  row,
  needsAnotherLibrarian,
}: {
  row: ManageQueueRow
  needsAnotherLibrarian: boolean
}) {
  const t = useT("library.manage.queue.preview")
  const manage = useT("library.manage")
  const queue = useT("library.manage.queue")
  const report = useT("library.report")
  const status = useT("library.item.status")
  const type = useT("library.type")
  const reasonText = useReasonText()
  const format = useFormatters()
  const id = row.item.id
  const detail = useQuery({ ...getLibraryItemQuery(id ?? ""), enabled: !!id })
  const title = row.suggestion?.title ?? row.item.title

  return (
    <article aria-label={t("title")} className="flex min-w-0 flex-col gap-4">
      <header className="flex gap-3">
        {id ? <CoverImage src={row.item.cover_url} className="h-28 w-20 shrink-0 rounded-md" /> : null}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {id ? (
              <SourceTag source={row.item.tag.source} />
            ) : (
              <Badge variant="outline">{queue("kind.suggestion")}</Badge>
            )}
            {detail.data ? <Badge variant="secondary">{status(detail.data.status)}</Badge> : null}
            {row.item.book ? <RightsBadge rights={row.item.book.rights} licence={row.item.book.licence} /> : null}
          </div>
          <h2 className="text-lg leading-snug font-semibold break-words">{title}</h2>
          {id ? (
            <p className="text-muted-foreground text-sm">
              {[row.item.author_label, type(row.item.type), row.item.year_published].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {id ? (
            <div className="flex flex-wrap gap-x-4">
              <Link
                href={itemHref(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex min-h-11 items-center gap-1 text-sm underline-offset-4 hover:underline md:min-h-8"
              >
                {t("openItem")}
                <IconExternalLink className="size-4" aria-hidden />
              </Link>
              {detail.data?.can.read ? (
                <Link
                  href={readHref({ item: id })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex min-h-11 items-center gap-1 text-sm underline-offset-4 hover:underline md:min-h-8"
                >
                  {t("openReader")}
                  <IconExternalLink className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {needsAnotherLibrarian ? (
        <p role="note" className="bg-muted flex items-start gap-2 rounded-lg border p-3 text-sm">
          <IconUserOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {manage("ownItem")}
        </p>
      ) : null}

      {row.suggestion ? <SuggestionBlock row={row} /> : null}

      {row.uploader ? (
        <Section title={t("uploader")}>
          <p className="text-sm">
            {row.uploader.name}
            {row.uploader.cohort ? `, ${row.uploader.cohort}` : ""}{" "}
            <span className="text-muted-foreground">({row.uploader.role})</span>
          </p>
        </Section>
      ) : null}

      <Section title={t("sent")}>
        <p className="text-sm">
          {format.dateTime(row.submitted_at)}{" "}
          <span className="text-muted-foreground">({format.relative(row.submitted_at)})</span>
        </p>
      </Section>

      {!row.suggestion ? (
        <Section title={t("findings")}>
          {row.scan.findings.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noFindings")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {row.scan.findings.map((finding) => (
                <li key={finding} className="flex items-start gap-2 text-sm">
                  <IconAlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
                  {finding}
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {row.reports.length > 0 ? (
        <Section title={t("reports")}>
          <ul className="flex flex-col gap-1 text-sm">
            {row.reports.map((entry) => (
              <li key={entry.reason}>
                {queue("reportCount", { count: entry.count, reason: report(`reason.${entry.reason}`) })}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {id ? (
        detail.isPending ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : detail.data ? (
          <>
            {detail.data.description ? (
              <Section title={t("description")}>
                <p className="line-clamp-6 text-sm break-words whitespace-pre-line">{detail.data.description}</p>
              </Section>
            ) : null}
            {detail.data.subjects.length > 0 ? (
              <Section title={t("subjects")}>
                <p className="text-sm">{detail.data.subjects.map((subject) => subject.name).join(", ")}</p>
              </Section>
            ) : null}
            <Section title={t("files")}>
              <FileList detail={detail.data} />
            </Section>
            {detail.data.status_reason ? (
              <Section title={t("statusReason")}>
                <p className="text-sm break-words">{reasonText(detail.data.status_reason)}</p>
              </Section>
            ) : null}
          </>
        ) : null
      ) : null}
    </article>
  )
}
