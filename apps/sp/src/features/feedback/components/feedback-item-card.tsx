"use client"

import { getFeedbackQuery, type FeedbackOut, type FeedbackStatus } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { formatDateTime, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FeedbackAttachmentList } from "./feedback-attachment"

const STATUS_VARIANT: Record<FeedbackStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  in_review: "secondary",
  planned: "secondary",
  done: "outline",
  rejected: "destructive",
}

/** One report of the list: its labels, text and attachments, and the admin responses behind a toggle. */
export function FeedbackItemCard({ item }: { item: FeedbackOut }) {
  const t = useT("feedback")
  const [open, setOpen] = useState(false)
  const detail = useQuery({ ...getFeedbackQuery(item.id), enabled: open })
  const hasResponses = item.response_count > 0

  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_VARIANT[item.status]}>{t(`status.${item.status}`)}</Badge>
        <Badge variant="outline">{t(`kind.${item.kind}`)}</Badge>
        <Badge variant="outline">{t(`area.${item.area}`)}</Badge>
      </div>
      <h2 className="text-base font-medium break-words">{item.title}</h2>
      <p className="text-muted-foreground text-sm whitespace-pre-line break-words">{item.description}</p>
      <p className="text-muted-foreground text-xs">{t("page.sentAt", { date: formatDateTime(item.created_at) })}</p>
      <FeedbackAttachmentList attachments={item.attachments} />
      {hasResponses ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 self-start md:min-h-8"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("page.hideResponses") : t("page.showResponses")}
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">{t("page.noResponses")}</p>
      )}
      {open ? (
        <section aria-label={t("page.responses")} className="flex flex-col gap-3">
          <QueryState query={detail} isEmpty={(data) => data.responses.length === 0} emptyText={t("page.noResponses")}>
            {(data) => (
              <ul className="flex flex-col gap-3">
                {data.responses.map((response) => (
                  <li key={response.id} className="bg-muted flex flex-col gap-2 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">
                      {t("page.responseBy", { name: response.author_name, date: formatDateTime(response.created_at) })}
                    </p>
                    <p className="text-sm whitespace-pre-line break-words">{response.text}</p>
                    <FeedbackAttachmentList attachments={response.attachments} />
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </section>
      ) : null}
    </article>
  )
}
