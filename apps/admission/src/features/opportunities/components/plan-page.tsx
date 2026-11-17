"use client"

import { ApiError } from "@ihsp/api"
import { formatDate, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  buttonVariants,
  Input,
  LoadingButton,
  PageHeader,
  Skeleton,
  StateView,
  Icons,
} from "@ihsp/ui"
import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { HeadingIcon } from "../../../components/lib/split-layout"
import { OpportunityTabs } from "./opportunity-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  localName,
  useAiPlan,
  useGenerateAiPlan,
  usePlan,
  useRemoveFromPlan,
  useSaveToPlan,
  useTaxonomy,
  type Opportunity,
  type Plan,
} from "../api"
import { GRADES } from "./catalog-page"
import { OpportunityCard } from "./opportunity-card"

const TERMS = ["fall", "spring", "summer"] as const

function AiError({ error }: { error: unknown }) {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const err = error instanceof ApiError ? error : null
  if (err?.type === "admission/consent_required")
    return (
      <Alert>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          {t("ai.consent")}
          <Link href="/settings/#consent" className={buttonVariants({ size: "sm" })}>
            {t("ai.consentLink")}
          </Link>
        </AlertDescription>
      </Alert>
    )
  if (err?.type === "admission/quota_exceeded" || err?.status === 429)
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("ai.quota")}</AlertDescription>
      </Alert>
    )
  return (
    <p role="alert" className="text-destructive text-sm">
      {errorMessage(error)}
    </p>
  )
}

function AiPlanner({ titles }: { titles: Map<string, string> }) {
  const t = useT("opportunities")
  const locale = useLocale()
  const current = useAiPlan()
  const generate = useGenerateAiPlan()
  const [interests, setInterests] = useState("")
  const [career, setCareer] = useState("")
  const plan = current.data?.plan

  function run(event: FormEvent) {
    event.preventDefault()
    generate.mutate({ locale: locale as "uz" | "ru" | "en", interests: interests.trim(), career: career.trim() })
  }

  return (
    <section className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <h2 className="font-medium">{t("ai.title")}</h2>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={run}>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {t("ai.interests")}
          <Input value={interests} maxLength={500} onChange={(e) => setInterests(e.target.value)} />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {t("ai.career")}
          <Input value={career} maxLength={300} onChange={(e) => setCareer(e.target.value)} />
        </label>
        <LoadingButton type="submit" loading={generate.isPending}>
          {plan ? t("ai.regenerate") : t("ai.generate")}
        </LoadingButton>
      </form>
      {generate.isError && <AiError error={generate.error} />}
      {plan && (
        <div className="animate-in fade-in flex flex-col gap-3 text-sm">
          {GRADES.map((grade) => {
            const steps = plan.steps.filter((s) => s.grade === grade)
            if (steps.length === 0) return null
            return (
              <div key={grade} className="flex flex-col gap-1">
                <h3 className="font-medium">{t("gradeLong", { grade })}</h3>
                <ul className="flex flex-col gap-1">
                  {steps.map((s) => (
                    <li key={s.opportunity_id}>
                      <span className="font-medium">{titles.get(s.opportunity_id) ?? "—"}</span>
                      {" · "}
                      {t(`term.${s.term}`)}
                      {s.why && <span className="text-muted-foreground"> — {s.why}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          {plan.conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul>
                  {plan.conflicts.map((c) => (
                    <li key={`${c.first_id}-${c.second_id}`}>
                      {titles.get(c.first_id)} / {titles.get(c.second_id)}: {c.reason}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {plan.deadlines.length > 0 && (
            <ul className="flex flex-col gap-1">
              {plan.deadlines.map((d) => (
                <li key={d.opportunity_id}>
                  <span className="font-medium">{titles.get(d.opportunity_id)}</span>: {d.note}
                </li>
              ))}
            </ul>
          )}
          {plan.notes.map((n, i) => (
            <p key={i} className="text-muted-foreground">
              {n}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

function Analytics({ plan }: { plan: Plan }) {
  const t = useT("opportunities")
  const locale = useLocale()
  const taxonomy = useTaxonomy()
  const a = plan.analytics
  const peak = Math.max(1, ...Object.values(a.load))
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="bg-card flex flex-col gap-2 rounded-card border p-4">
        <h2 className="font-medium">{t("loadTitle")}</h2>
        <table className="text-sm">
          <thead>
            <tr>
              <th />
              {TERMS.map((term) => (
                <th key={term} className="text-muted-foreground font-normal">
                  {t(`term.${term}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRADES.map((grade) => (
              <tr key={grade}>
                <th className="text-left font-normal">{t("gradeShort", { grade })}</th>
                {TERMS.map((term) => {
                  const n = a.load[`${grade}:${term}`] ?? 0
                  return (
                    <td key={term} className="p-1 text-center">
                      <span
                        className="bg-primary/15 inline-block min-w-8 rounded px-1 transition-colors"
                        style={{ opacity: 0.4 + (0.6 * n) / peak }}
                      >
                        {n}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {a.unplaced > 0 && <p className="text-muted-foreground text-xs">{t("unplaced", { count: a.unplaced })}</p>}
      </div>
      <div className="bg-card flex flex-col gap-2 rounded-card border p-4">
        <h2 className="font-medium">{t("coverageTitle")}</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {(taxonomy.data?.fields ?? []).map((f) => (
            <li key={f.id} className="flex justify-between gap-2">
              <span>{localName(f.name, locale)}</span>
              <span className={a.coverage[f.id] ? "font-medium" : "text-muted-foreground"}>
                {a.coverage[f.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Entry({ item, grade }: { item: Opportunity; grade: number | null }) {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const onError = (error: unknown) => toast.error(errorMessage(error))
  return (
    <OpportunityCard
      item={item}
      action={
        <div className="flex flex-wrap gap-1">
          {GRADES.map((g) => (
            <Button
              key={g}
              type="button"
              size="sm"
              variant={g === grade ? "default" : "outline"}
              aria-pressed={g === grade}
              disabled={save.isPending}
              onClick={() => save.mutate({ id: item.id, planned_grade: g }, { onError })}
            >
              {g}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id, { onError })}
          >
            {t("removeFromPlan")}
          </Button>
        </div>
      }
    />
  )
}

export function PlanBody() {
  const t = useT("opportunities")
  const query = usePlan()
  const titles = useMemo(() => new Map(query.data?.opportunities.map((o) => [o.id, o.fields.title])), [query.data])
  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <StateView state="error" onRetry={() => void query.refetch()} />
  else if (query.data.entries.length === 0)
    body = (
      <StateView
        state="empty"
        icon={<Icons.heart aria-hidden />}
        title={t("planEmptyTitle")}
        description={t("planEmptyText")}
        action={
          <Link href="/opportunities/" className={buttonVariants()}>
            {t("browse")}
          </Link>
        }
      />
    )
  else {
    const plan = query.data
    const byId = new Map(plan.opportunities.map((o) => [o.id, o]))
    const conflicts = plan.analytics.conflicts
    body = (
      <>
        <Analytics plan={plan} />
        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul>
                {conflicts.map((c) => (
                  <li key={`${c.first_id}-${c.second_id}-${c.day}`}>
                    {t("conflict", {
                      first: titles.get(c.first_id) ?? "",
                      second: titles.get(c.second_id) ?? "",
                      day: formatDate(c.day),
                    })}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {plan.deadlines.length > 0 && (
          <section className="bg-card flex flex-col gap-2 rounded-card border p-4">
            <h2 className="font-medium">{t("deadlinesTitle")}</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {plan.deadlines.slice(0, 10).map((d) => (
                <li key={`${d.opportunity_id}-${d.kind}-${d.day}`} className="flex flex-wrap gap-2">
                  <span className="tabular-nums">{formatDate(d.day)}</span>
                  <span className="font-medium">{d.title}</span>
                  <span className="text-muted-foreground">
                    {t(`dateKind.${d.kind}`)}
                    {d.projected ? ` · ${t("expected")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <AiPlanner titles={titles} />
        <ScrollFade maxHeight="75vh">
          <ul className="grid gap-3 md:grid-cols-2">
            {plan.entries.map((e) => {
              const item = byId.get(e.opportunity_id)
              return item ? <Entry key={e.id} item={item} grade={e.planned_grade} /> : null
            })}
          </ul>
        </ScrollFade>
      </>
    )
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t("planTitle")} back={<HeadingIcon name="heart" />} />
      <OpportunityTabs value="plan" planCount={query.data?.entries.length ?? 0} />
      {body}
    </div>
  )
}

export function OpportunityPlanPage() {
  return (
    <AdmissionShell>
      <PlanBody />
    </AdmissionShell>
  )
}
