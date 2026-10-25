"use client"

import type { AdminFeedbackResponse } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { FeedbackAttachmentList } from "./feedback-attachment-list"

/** The replies sent to the reporter, oldest first, each with the delivery result per channel. */
export function FeedbackThread({ responses }: { responses: readonly AdminFeedbackResponse[] }) {
  const t = useT("callForImprovements")
  if (responses.length === 0) return <p className="text-muted-foreground text-sm">{t("detail.noReplies")}</p>
  return (
    <ol className="flex flex-col gap-3">
      {responses.map((response) => (
        <li key={response.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <ResponseHeader response={response} />
          <p className="text-sm whitespace-pre-wrap">{response.text}</p>
          {response.attachments.length > 0 ? <FeedbackAttachmentList attachments={response.attachments} /> : null}
          <ul className="flex flex-wrap gap-2" aria-label={t("detail.deliveries")}>
            {response.deliveries.map((delivery) => (
              <li key={delivery.channel}>
                <Badge variant={delivery.status === "sent" ? "secondary" : "destructive"}>
                  {t(`detail.channel.${delivery.channel}`)}: {t(`detail.delivery.${delivery.status}`)}
                </Badge>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function ResponseHeader({ response }: { response: AdminFeedbackResponse }) {
  const f = useFormatters()
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
      <span className="text-foreground font-medium">{response.author_name}</span>
      <time dateTime={response.created_at}>{f.dateTime(response.created_at)}</time>
    </span>
  )
}
