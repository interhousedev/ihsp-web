"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { detailHref } from "./scholarship-card"
import type { Opportunity, OpportunityKind } from "../api"

export const KIND_TONE = {
  exam: "warning",
  certification: "success",
  course: "primary",
  event: "neutral",
  scholarship: "success",
  recurring: "neutral",
  program: "primary",
} as const satisfies Record<OpportunityKind, "warning" | "success" | "primary" | "neutral">

const KIND_ICON = {
  exam: "exams",
  certification: "certificates",
  course: "courses",
  scholarship: "certificates",
  event: "calendarEvent",
  recurring: "clock",
  program: "globe",
} as const satisfies Record<OpportunityKind, keyof typeof Icons>

/** One catalog entry: kind, grades, the next dates (projected ones marked) and its materials. */
export function OpportunityCard({ item, action }: { item: Opportunity; action?: ReactNode }) {
  const t = useT("opportunities")
  const f = item.fields
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <LogoAvatar
          name={item.org?.name ?? f.provider ?? f.title}
          src={item.org?.logo_url ?? f.logo_url}
          fit="contain"
          className="size-10 shrink-0 ring-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={detailHref(item.id)} className="font-medium hover:underline">
            {f.title}
          </Link>
          <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <Pill tone={KIND_TONE[f.kind]} className="gap-1">
              {(() => {
                const Icon = Icons[KIND_ICON[f.kind]]
                return <Icon aria-hidden className="size-3" />
              })()}
              {t(`kind.${f.kind}`)}
            </Pill>
            {f.provider ? f.provider : null}
          </span>
        </div>
        {action}
      </div>
      {f.summary && (
        <div className="flex flex-col gap-1">
          <p lang="en" className="text-sm">
            {f.summary}
          </p>
          <span className="text-muted-foreground text-xs">{t("sourceLanguage")}</span>
        </div>
      )}
      {(f.grades ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(f.grades ?? []).map((g) => (
            <Badge key={g} variant="secondary">
              {t("gradeShort", { grade: g })}
            </Badge>
          ))}
        </div>
      )}
      {item.upcoming.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {item.upcoming.slice(0, 3).map((d) => (
            <li key={`${d.kind}-${d.day}`} className="flex items-center gap-2">
              <Icons.calendarEvent aria-hidden className="size-4 shrink-0" />
              <span>
                {t(`dateKind.${d.kind}`)}: {formatDate(d.day)}
              </span>
              {d.projected && <span className="text-muted-foreground text-xs">{t("expected")}</span>}
            </li>
          ))}
        </ul>
      )}
      {(f.url || (f.materials ?? []).length > 0) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {f.url && (
            <a
              className="text-primary inline-flex min-h-11 items-center gap-1 underline md:min-h-9"
              href={f.url}
              target="_blank"
              rel="noreferrer"
            >
              {t("officialSite")}
              <Icons.externalLink aria-hidden className="size-3" />
            </a>
          )}
          {(f.materials ?? []).map((m, i) =>
            m.url ? (
              <a key={i} className="text-primary underline" href={m.url} target="_blank" rel="noreferrer">
                {t(`material.${m.kind}`)}: {m.title}
              </a>
            ) : (
              <span key={i}>
                {t(`material.${m.kind}`)}: {m.title}
              </span>
            ),
          )}
        </div>
      )}
    </li>
  )
}

export function SaveButton({ saved, busy, onClick }: { saved: boolean; busy: boolean; onClick: () => void }) {
  const t = useT("opportunities")
  return (
    <Button type="button" size="sm" variant={saved ? "outline" : "default"} disabled={busy} onClick={onClick}>
      {saved ? t("removeFromPlan") : t("saveToPlan")}
    </Button>
  )
}
