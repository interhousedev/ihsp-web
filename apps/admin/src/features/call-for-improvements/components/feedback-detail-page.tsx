"use client"

import { getAdminFeedbackItemQuery, type AdminFeedbackDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import type { ReactNode } from "react"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { FeedbackAttachmentList } from "./feedback-attachment-list"
import { FeedbackReplyForm } from "./feedback-reply-form"
import { FeedbackStatusBadge } from "./feedback-status-badge"
import { FeedbackStatusSelect } from "./feedback-status-select"
import { FeedbackThread } from "./feedback-thread"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** One feedback item (admin): its fields, reporter, attachments, status, replies and the reply form. Reads `?id=`. */
export function FeedbackDetailPage() {
  const t = useT("callForImprovements")
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery({ ...getAdminFeedbackItemQuery(id ?? ""), enabled: id !== null })

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("detail.missingId")} />
      </PageContainer>
    )
  }
  return (
    <PageContainer
      title={query.data?.title ?? t("title")}
      actions={<BackLink href="/call-for-improvements/" label={t("detail.back")} />}
    >
      <QueryState query={query} rows={6}>
        {(item) => <FeedbackBody item={item} />}
      </QueryState>
    </PageContainer>
  )
}

function FeedbackBody({ item }: { item: AdminFeedbackDetail }) {
  const t = useT("callForImprovements")
  const f = useFormatters()
  const reporter = item.reporter
  return (
    <div className="flex flex-col gap-8">
      <Section title={t("detail.fields")}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label={t("columns.kind")}>{t(`kind.${item.kind}`)}</Field>
          <Field label={t("columns.area")}>{t(`area.${item.area}`)}</Field>
          <Field label={t("detail.source")}>{t(`source.${item.source}`)}</Field>
          <Field label={t("detail.received")}>{f.dateTime(item.created_at)}</Field>
          <Field label={t("detail.page")}>
            {item.page_url ? (
              <a
                href={item.page_url}
                rel="noopener noreferrer"
                className="break-all underline-offset-4 hover:underline"
              >
                {item.page_url}
              </a>
            ) : (
              "—"
            )}
          </Field>
          <Field label={t("detail.reporter")}>
            <Link
              href={`/users/view/?id=${encodeURIComponent(reporter.user_id)}`}
              className="underline-offset-4 hover:underline"
            >
              {reporter.display_name}
            </Link>
          </Field>
          <Field label={t("detail.group")}>{reporter.group_name ?? "—"}</Field>
          <Field label={t("detail.roles")}>
            {reporter.roles.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {reporter.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </span>
            ) : (
              "—"
            )}
          </Field>
        </dl>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{item.title}</h3>
          <p className="text-sm whitespace-pre-wrap">{item.description}</p>
        </div>
      </Section>

      <Section title={t("detail.statusLabel")}>
        <div className="flex flex-wrap items-center gap-3">
          <FeedbackStatusBadge status={item.status} />
          <FeedbackStatusSelect item={item} />
        </div>
      </Section>

      <Section title={t("detail.attachments")}>
        <FeedbackAttachmentList attachments={item.attachments} />
      </Section>

      <Section title={t("detail.thread")}>
        <FeedbackThread responses={item.responses} />
      </Section>

      <Section title={t("detail.reply.title")}>
        <FeedbackReplyForm feedbackId={item.id} />
      </Section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
