"use client"

import { formatDate, useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Pill, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useOpportunity, usePlan, useRemoveFromPlan, useSaveToPlan } from "../api"
import { OpportunityComments } from "./opportunity-comments"
import { KIND_TONE } from "./opportunity-card"
import { AwardPill } from "./scholarship-card"

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function OpportunityDetailBody() {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const id = useSearchParams().get("id")
  const query = useOpportunity(id)
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()

  const back = (
    <Link href="/opportunities/" className="text-primary text-sm hover:underline">
      {t("detail.back")}
    </Link>
  )
  if (!id) return <StateView state="empty" title={t("detail.notFound")} action={back} />
  if (query.isLoading) return <StateView state="loading" rows={4} />
  if (query.isError || !query.data)
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />

  const item = query.data
  const f = item.fields
  const orgName = item.org?.name ?? f.provider
  const deadline = item.upcoming[0]?.day
  const saved = plan.data?.entries.some((e) => e.opportunity_id === item.id) ?? false
  const busy = save.isPending || remove.isPending
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const toggle = () => (saved ? remove.mutate(item.id, { onError }) : save.mutate({ id: item.id }, { onError }))

  return (
    <div className={pageClass("default")}>
      {back}
      <div className="flex items-start gap-4">
        <LogoAvatar
          name={orgName ?? f.title}
          src={item.org?.logo_url ?? f.logo_url}
          fit="contain"
          className="size-14 ring-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-xl font-semibold break-words">{f.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={KIND_TONE[f.kind]}>{t(`kind.${f.kind}`)}</Pill>
            {f.provider ? <span className="text-muted-foreground text-sm">{f.provider}</span> : null}
          </div>
          {item.upcoming.length > 0 ? (
            <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {item.upcoming.slice(0, 3).map((d) => (
                <li key={`${d.kind}-${d.day}`} className="flex items-center gap-1">
                  <Icons.calendarEvent aria-hidden className="size-4 shrink-0" />
                  {t(`dateKind.${d.kind}`)}: {formatDate(d.day)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {f.award_type ? <AwardPill award={f.award_type} /> : null}
            {f.scope ? <Pill tone="neutral">{t(`scope.${f.scope}`)}</Pill> : null}
            {(f.coverage ?? []).map((c) => (
              <Pill key={c} tone="neutral">
                {t(`coverage.${c}`)}
              </Pill>
            ))}
            {f.college_credit && f.college_credit !== "none" ? (
              <Pill tone="success">{t(`credit.${f.college_credit}`)}</Pill>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button variant="outline" aria-pressed={saved} disabled={busy} onClick={toggle}>
            <Icons.heart aria-hidden className={saved ? "fill-destructive text-destructive size-4" : "size-4"} />
            {saved ? t("removeFromPlan") : t("saveToPlan")}
          </Button>
          {saved ? (
            <Link href="/plan/?view=saved" className="text-primary text-sm hover:underline">
              {t("openPlan")}
            </Link>
          ) : null}
        </div>
      </div>

      {f.summary ? <p className="text-sm whitespace-pre-wrap">{f.summary}</p> : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        {f.amount_text ? (
          <Fact label={t("detail.amount")}>
            <span className="text-success font-medium">{f.amount_text}</span>
          </Fact>
        ) : null}
        {deadline ? <Fact label={t("detail.deadline")}>{formatDate(deadline)}</Fact> : null}
        {f.essay_required ? <Fact label={t("detail.essay")}>{t("scholarships.essay")}</Fact> : null}
        {f.eligibility ? <Fact label={t("detail.eligibility")}>{f.eligibility}</Fact> : null}
        {f.credit_note ? <Fact label={t("detail.creditNote")}>{f.credit_note}</Fact> : null}
        {f.source_url ? (
          <Fact label={t("detail.source")}>
            <a href={f.source_url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
              {t("officialSite")}
            </a>
          </Fact>
        ) : null}
      </dl>

      <OpportunityComments
        opportunityId={item.id}
        comments={item.comments ?? []}
        canModerate={item.can_moderate ?? false}
      />
    </div>
  )
}

export function OpportunityDetailPage() {
  return (
    <AdmissionShell>
      <OpportunityDetailBody />
    </AdmissionShell>
  )
}
