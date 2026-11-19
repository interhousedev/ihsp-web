"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { cn, Icons, Pill } from "@ihsp/ui"
import { DeadlineDate } from "../../../components/lib/deadline-chip"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import type { AwardType, Opportunity } from "../api"

export function AwardPill({ award }: { award: AwardType }) {
  const t = useT("opportunities")
  return <Pill tone="success">{t(`award.${award}`)}</Pill>
}

export function detailHref(id: string) {
  return `/opportunities/view/?id=${encodeURIComponent(id)}`
}

/** A scholarship tile in the Kollegio style: type pill, save heart, "Essay req." marker, green amount | date line. */
export function ScholarshipCard({
  item,
  saved,
  busy,
  onToggle,
  className,
}: {
  item: Opportunity
  saved: boolean
  busy: boolean
  onToggle: () => void
  className?: string
}) {
  const t = useT("opportunities")
  const f = item.fields
  const deadline = item.next_deadline ?? item.upcoming[0]?.day
  const orgName = item.org?.name ?? f.provider
  return (
    <div
      className={cn(
        "bg-card relative flex h-full flex-col gap-3 rounded-card border p-4 transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <LogoAvatar
            name={orgName ?? f.title}
            src={item.org?.logo_url ?? f.logo_url}
            fit="contain"
            className="size-10 shrink-0 ring-0"
          />
          <div className="flex min-w-0 flex-col">
            <Link href={detailHref(item.id)} className="line-clamp-2 font-semibold after:absolute after:inset-0">
              {f.title}
            </Link>
            {orgName ? <span className="text-muted-foreground truncate text-xs">{orgName}</span> : null}
          </div>
        </div>
        <button
          type="button"
          aria-label={saved ? t("removeFromPlan") : t("saveToPlan")}
          aria-pressed={saved}
          disabled={busy}
          onClick={onToggle}
          className="text-muted-foreground hover:text-destructive relative z-10 -m-2 flex size-11 shrink-0 items-center justify-center md:size-9"
        >
          <Icons.heart aria-hidden className={cn("size-5", saved && "fill-destructive text-destructive")} />
        </button>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-2 border-y py-3">
        {f.award_type ? <AwardPill award={f.award_type} /> : null}
        {f.scope ? <Pill tone="neutral">{t(`scope.${f.scope}`)}</Pill> : null}
        {f.essay_required ? (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Icons.edit aria-hidden className="size-3" />
            {t("scholarships.essay")}
          </span>
        ) : null}
      </div>
      <p className="mt-auto flex flex-wrap items-baseline gap-x-3 text-lg font-semibold">
        {f.amount_text ? <span className="text-success">{f.amount_text}</span> : null}
        {f.amount_text && deadline ? <span aria-hidden className="bg-border h-5 w-px self-center" /> : null}
        {deadline ? <DeadlineDate date={deadline} text={formatDate(deadline)} className="tabular-nums" /> : null}
        {!f.amount_text && !deadline ? (
          <span className="text-muted-foreground text-sm font-normal">{t("scholarships.noDeadline")}</span>
        ) : null}
      </p>
    </div>
  )
}
