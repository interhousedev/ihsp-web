"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Pill, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { useEssays } from "../api"
import { CoachError } from "../components/coach-error"
import {
  type DeepRead,
  type ParagraphStrength,
  type UniEntry,
  useDeepRead,
  useGroupCritique,
  useRunDeepRead,
  useStoredReviews,
} from "./steps-api"
import { Section, StepHead, StepNext } from "./step-parts"

const STRENGTH_TONE = { strong: "success", ok: "neutral", weak: "warning" } as const
const STRENGTH_BAR: Record<ParagraphStrength, string> = {
  strong: "bg-success",
  ok: "bg-hairline-strong",
  weak: "bg-warning",
}

/** A ring filled in proportion to the 0-100 uniqueness; the number sits in the middle. */
function Ring({ value, label }: { value: number; label: string }) {
  const r = 44
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, value))
  return (
    <svg viewBox="0 0 108 108" role="img" aria-label={label} className="text-primary size-28 shrink-0">
      <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-hairline)" strokeWidth="9" />
      <circle
        cx="54"
        cy="54"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(c * v) / 100} ${c}`}
        transform="rotate(-90 54 54)"
      />
      <text x="54" y="62" textAnchor="middle" className="fill-foreground text-[28px] font-semibold">
        {value}
      </text>
    </svg>
  )
}

function Uniqueness({ read }: { read: DeepRead }) {
  const t = useT("essayFlow")
  return (
    <div className="bg-card border-hairline rounded-card flex flex-wrap items-center gap-4 border p-4">
      <Ring value={read.uniqueness} label={t("deep.uniquenessLabel", { value: read.uniqueness })} />
      <div className="min-w-0 flex-1 basis-56">
        <h3 className="text-sm font-semibold">{t("deep.uniqueness")}</h3>
        <p className="mt-1 text-sm">{read.uniqueness_note}</p>
        {read.tropes.length > 0 ? (
          <div className="mt-3">
            <p className="text-muted-foreground text-xs">{t("deep.tropes")}</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {read.tropes.map((trope) => (
                <li key={trope}>
                  <Pill tone="warning">{trope}</Pill>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 text-xs">{t("deep.noTropes")}</p>
        )}
      </div>
    </div>
  )
}

/** The one concrete change: which paragraph, what is weak and a sentence to try. */
function Fix({ read }: { read: DeepRead }) {
  const t = useT("essayFlow")
  return (
    <div className="bg-warning-muted/40 border-hairline rounded-card flex flex-col gap-2 border p-4">
      <h3 className="text-sm font-semibold">{t("deep.fix")}</h3>
      <p className="text-muted-foreground text-xs">
        {t("deep.fixWhere", { paragraph: read.fix_paragraph, dimension: read.fix_dimension })}
      </p>
      <p className="text-sm">{read.fix_problem}</p>
      <p className="text-sm">
        <span className="font-semibold">{t("deep.fixTry")} </span>
        {read.fix_try}
      </p>
    </div>
  )
}

function ParagraphMap({ read }: { read: DeepRead }) {
  const t = useT("essayFlow")
  return (
    <Section title={t("deep.paragraphs")} hint={t("deep.paragraphsHint")}>
      <ol className="flex flex-col gap-2">
        {read.paragraphs.map((p) => (
          <li
            key={p.paragraph}
            className={cn(
              "bg-card border-hairline rounded-card flex gap-3 border p-3",
              p.paragraph === read.fix_paragraph && "ring-warning/50 ring-1",
            )}
          >
            <span aria-hidden className={cn("w-1 shrink-0 rounded-full", STRENGTH_BAR[p.strength])} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs font-medium">
                  {t("deep.paragraph", { n: p.paragraph })}
                </span>
                <Pill tone="primary">{t(`deep.roles.${p.role}` as "deep.roles.hook")}</Pill>
                <Pill tone={STRENGTH_TONE[p.strength]}>{t(`deep.strength.${p.strength}` as "deep.strength.ok")}</Pill>
              </div>
              <p className="mt-1 text-sm">{p.reveals}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Moments({ read }: { read: DeepRead }) {
  const t = useT("essayFlow")
  if (read.moments.length === 0) return null
  return (
    <Section title={t("deep.moments")} hint={t("deep.momentsHint")}>
      <ul className="grid gap-2 md:grid-cols-2">
        {read.moments.map((m) => (
          <li key={`${m.paragraph}-${m.quote}`} className="bg-card border-hairline rounded-card flex flex-col gap-1.5 border p-3">
            <div className="flex items-center gap-1.5">
              <Pill tone="success">{t(`deep.kind.${m.kind}` as "deep.kind.fresh")}</Pill>
              <span className="text-muted-foreground text-xs">{t("deep.paragraph", { n: m.paragraph })}</span>
            </div>
            <blockquote className="border-primary/40 border-l-2 pl-3 text-sm italic">“{m.quote}”</blockquote>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function UniCard({ entry }: { entry: UniEntry }) {
  const t = useT("essayFlow")
  const r = entry.review
  return (
    <li className="bg-card border-hairline rounded-card flex flex-col gap-2 border p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="min-w-0 truncate text-sm font-semibold">{entry.name}</h4>
        {entry.stale ? <Pill tone="warning">{t("deep.stale")}</Pill> : null}
      </div>
      <div className="flex items-center gap-2" role="img" aria-label={t("deep.alignment", { value: r.alignment })}>
        <div className="bg-hairline h-2 flex-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, r.alignment))}%` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums">{r.alignment}</span>
      </div>
      <p className="text-sm">{r.fit_summary}</p>
      {r.risks.length > 0 ? (
        <ul className="text-muted-foreground list-disc pl-4 text-xs">
          {r.risks.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : null}
      {r.supplement_tips.length > 0 ? (
        <div>
          <p className="text-xs font-medium">{t("deep.tips")}</p>
          <ul className="text-muted-foreground list-disc pl-4 text-xs">
            {r.supplement_tips.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

function GroupFit({ essayId }: { essayId: string }) {
  const t = useT("essayFlow")
  const stored = useStoredReviews(essayId)
  const critique = useGroupCritique(essayId)
  const universities = (critique.data ?? stored.data)?.universities ?? []
  return (
    <Section title={t("deep.fit")} hint={t("deep.fitHint")}>
      {stored.isPending ? <Skeleton className="h-24 w-full" /> : null}
      {universities.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {universities.map((u) => (
            <UniCard key={u.institution_id} entry={u} />
          ))}
        </ul>
      ) : stored.isSuccess ? (
        <p className="text-muted-foreground text-sm">{t("deep.fitEmpty")}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={critique.isPending} onClick={() => critique.mutate(universities.length > 0)}>
          <Icons.sparkles aria-hidden />
          {critique.isPending ? t("deep.running") : universities.length > 0 ? t("deep.fitRerun") : t("deep.fitRun")}
        </Button>
      </div>
      <CoachError error={critique.error} />
    </Section>
  )
}

function ReadBody({ essayId }: { essayId: string }) {
  const t = useT("essayFlow")
  const query = useDeepRead(essayId)
  const run = useRunDeepRead(essayId)
  if (query.isPending) return <Skeleton className="h-48 w-full" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const { read, stale } = query.data
  return (
    <div className="flex flex-col gap-4">
      {read ? (
        <>
          {stale ? (
            <p className="bg-warning-muted text-warning rounded-md px-3 py-2 text-sm" role="status">
              {t("deep.staleNote")}
            </p>
          ) : null}
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <Uniqueness read={read} />
            <Fix read={read} />
          </div>
          <ParagraphMap read={read} />
          <Moments read={read} />
        </>
      ) : (
        <div className="bg-card border-hairline rounded-card flex flex-col items-start gap-2 border p-4">
          <p className="text-sm">{t("deep.notRun")}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={run.isPending} onClick={() => run.mutate(read !== null)}>
          <Icons.sparkles aria-hidden />
          {run.isPending ? t("deep.running") : read ? t("deep.rerun") : t("deep.run")}
        </Button>
        <span className="text-muted-foreground text-xs">{t("deep.runHint")}</span>
      </div>
      <CoachError error={run.error} />
      <GroupFit essayId={essayId} />
    </div>
  )
}

/** Step 5: a paragraph-by-paragraph reading of one essay, its uniqueness, one fix and its fit per university. */
export function DeepReadStep({ onNext }: { onNext?: () => void }) {
  const t = useT("essayFlow")
  const te = useT("essays")
  const essays = useEssays()
  const [picked, setPicked] = useState("")
  const items = essays.data?.items ?? []
  const current = picked || items[0]?.id || ""
  return (
    <div className="flex flex-col gap-4" data-testid="deep-step">
      <StepHead title={t("deep.title")} intro={t("deep.intro")} />
      {essays.isPending ? <Skeleton className="h-9 w-full" /> : null}
      {essays.isError ? <StateView state="error" error={essays.error} onRetry={() => void essays.refetch()} /> : null}
      {essays.isSuccess && items.length === 0 ? <StateView state="empty" emptyText={t("deep.noEssays")} /> : null}
      {items.length > 0 ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="deep-essay" className="text-sm font-medium">
            {t("deep.pick")}
          </label>
          <Select
            items={items.map((e) => ({ value: e.id, label: `${e.title || te("untitled")} · ${te("words", { count: e.word_count })}` }))}
            value={current}
            onValueChange={(next) => next && setPicked(next)}
          >
            <SelectTrigger id="deep-essay" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title || te("untitled")} · {te("words", { count: e.word_count })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {current ? <ReadBody key={current} essayId={current} /> : null}
      <StepNext label={t("deep.next")} onNext={onNext} />
    </div>
  )
}
