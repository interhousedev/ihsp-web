"use client"

import { getMeOutboundMail, keys, type SentMailItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, IconPaperclip, PageContainer, StateView } from "@ihsp/ui"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ComposeMailForm } from "./compose-mail-form"

const PAGE_SIZE = 20

function SentRow({ mail }: { mail: SentMailItem }) {
  const format = useFormatters()
  return (
    <li className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{mail.subject}</span>
        <time className="text-muted-foreground shrink-0 text-xs" dateTime={mail.sent_at}>
          {format.dateTime(new Date(mail.sent_at))}
        </time>
      </div>
      <span className="text-muted-foreground truncate text-xs">{mail.to.join(", ")}</span>
      {mail.snippet ? <span className="text-muted-foreground line-clamp-2 text-xs">{mail.snippet}</span> : null}
      {mail.attachment_name ? (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <IconPaperclip aria-hidden className="size-3.5" />
          {mail.attachment_name}
        </span>
      ) : null}
    </li>
  )
}

/** The Email page: the compose form and the list of emails the user sent from the platform. */
export function MailPage() {
  const t = useT("mailPage")
  const sent = useInfiniteQuery({
    queryKey: [...keys.me.outboundMail({ limit: PAGE_SIZE }), "pages"],
    queryFn: ({ pageParam, signal }) =>
      getMeOutboundMail({ limit: PAGE_SIZE, ...(pageParam ? { before: pageParam } : {}) }, { signal }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_before ?? undefined,
  })
  const items = (sent.data?.pages ?? []).flatMap((page) => page.items)

  return (
    <PageContainer title={t("title")}>
      <div className="flex w-full flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="mail-compose-title" className="flex flex-col gap-3">
          <h2 id="mail-compose-title" className="text-base font-semibold">
            {t("compose")}
          </h2>
          <ComposeMailForm />
        </section>
        <section aria-labelledby="mail-sent-title" className="flex flex-col gap-3">
          <h2 id="mail-sent-title" className="text-base font-semibold">
            {t("sent")}
          </h2>
          {sent.isPending ? <StateView state="loading" rows={3} /> : null}
          {sent.isError ? <StateView state="error" error={sent.error} onRetry={() => void sent.refetch()} /> : null}
          {sent.isSuccess && items.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
          {items.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {items.map((mail) => (
                <SentRow key={mail.id} mail={mail} />
              ))}
            </ul>
          ) : null}
          {sent.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={sent.isFetchingNextPage}
              onClick={() => void sent.fetchNextPage()}
            >
              {t("loadMore")}
            </Button>
          ) : null}
        </section>
      </div>
    </PageContainer>
  )
}
