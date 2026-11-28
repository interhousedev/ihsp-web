"use client"

import { pageClass } from "../../../components/lib/page"
import { ApiError } from "@ihsp/api"
import { formatDate, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  buttonVariants,
  Input,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StateView,
  Icons,
} from "@ihsp/ui"
import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  useAiPlan,
  useGenerateAiPlan,
  usePlan,
  useRemoveFromPlan,
  useSaveToPlan,
  type Opportunity,
  type Plan,
} from "../api"
import { useStudentGrade } from "../../../config/applicant"
import { PersonalFinds } from "./personal-finds"
import { useSchoolGrades } from "../../../lib/config"

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
  const GRADES = useSchoolGrades()
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

const UNSET = "unset"

type Cell = { grade: number | null; term: (typeof TERMS)[number] | typeof UNSET }

function Placement({ item, entry }: { item: Opportunity; entry: Plan["entries"][number] }) {
  const GRADES = useSchoolGrades()
  const t = useT("opportunities")
  const tItems = useT("items")
  const errorMessage = useErrorMessage()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const myGrade = useStudentGrade()
  // The student's own grade comes first, so the common choice is at the top of the list.
  const ordered = [...GRADES].sort((a, b) => Number(b === myGrade) - Number(a === myGrade))
  const options: Cell[] = ordered.flatMap((grade) => TERMS.map((term) => ({ grade, term })))
  const current = entry.planned_grade === null ? "" : `${entry.planned_grade}:${entry.planned_term ?? UNSET}`
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-2 text-sm">
      <Link
        href={`/opportunities/view/?id=${encodeURIComponent(item.id)}`}
        className="line-clamp-2 break-words font-medium hover:underline"
      >
        {item.fields.title}
      </Link>
      <div className="flex items-center gap-1">
        <Select
          value={current}
          onValueChange={(v) => {
            if (!v) return
            const [grade, term] = v.split(":")
            save.mutate(
              {
                id: item.id,
                planned_grade: Number(grade),
                planned_term: term === UNSET ? null : (term as (typeof TERMS)[number]),
              },
              { onError },
            )
          }}
        >
          <SelectTrigger aria-label={t("place")} className="h-8 min-w-0 flex-1">
            <SelectValue>
              {current ? placeLabel(t, entry.planned_grade, entry.planned_term) : t("placeGrade")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={`${o.grade}:${o.term}`} value={`${o.grade}:${o.term}`}>
                {placeLabel(t, o.grade, o.term)}
                {o.grade === myGrade ? ` · ${t("currentGrade")}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={t("removeFromPlan")}
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(item.id, {
              onError,
              onSuccess: () =>
                toast(t("removedFromPlan"), {
                  action: {
                    label: t("undo"),
                    onClick: () =>
                      save.mutate(
                        { id: item.id, planned_grade: entry.planned_grade, planned_term: entry.planned_term },
                        { onError },
                      ),
                  },
                }),
            })
          }
        >
          <Icons.close aria-hidden className="size-4" />
        </Button>
      </div>
      <Link
        href={`/activities/?item=new&from=${encodeURIComponent(entry.id)}`}
        className="text-primary text-xs hover:underline"
      >
        {tItems("plan.addToAchievements")}
      </Link>
    </li>
  )
}

function placeLabel(t: ReturnType<typeof useT>, grade: number | null, term: string | null): string {
  const termText = term && term !== UNSET ? t(`term.${term}`) : t("termNotSet")
  return grade === null ? t("unplacedTitle") : `${t("gradeShort", { grade })} · ${termText}`
}

/** The saved plan: one row per school grade, one column per term, plus what is not placed yet. */
function Board({ plan }: { plan: Plan }) {
  const GRADES = useSchoolGrades()
  const t = useT("opportunities")
  const byId = new Map(plan.opportunities.map((o) => [o.id, o]))
  const rows = plan.entries.flatMap((e) => {
    const item = byId.get(e.opportunity_id)
    return item ? [{ entry: e, item }] : []
  })
  const cellRows = (grade: number, term: string) =>
    rows.filter((r) => r.entry.planned_grade === grade && (r.entry.planned_term ?? UNSET) === term)
  const unplaced = rows.filter((r) => r.entry.planned_grade === null || !GRADES.includes(r.entry.planned_grade))
  const columns = rows.some((r) => r.entry.planned_grade !== null && !r.entry.planned_term)
    ? ([...TERMS, UNSET] as const)
    : TERMS
  return (
    <section aria-label={t("boardTitle")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">{t("boardTitle")}</h2>
        <Link href="/opportunities/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Icons.add aria-hidden />
          {t("findMore")}
        </Link>
      </div>
      {unplaced.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-sm">{t("unplacedTitle")}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((r) => (
              <Placement key={r.entry.id} item={r.item} entry={r.entry} />
            ))}
          </ul>
        </div>
      )}
      {GRADES.map((grade) => (
        <div key={grade} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("gradeLong", { grade })}</h3>
          <div className={`grid gap-2 ${columns.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {columns.map((term) => {
              const here = cellRows(grade, term)
              return (
                <div key={term} className="bg-muted/40 flex min-h-16 flex-col gap-2 rounded-card p-2">
                  <p className="text-muted-foreground text-xs">
                    {term === UNSET ? t("termNotSet") : t(`term.${term}`)}
                    {here.length > 0 ? ` · ${here.length}` : ""}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {here.map((r) => (
                      <Placement key={r.entry.id} item={r.item} entry={r.entry} />
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

export function PlanBody() {
  const t = useT("opportunities")
  const grades = useSchoolGrades()
  const query = usePlan()
  const titles = useMemo(() => new Map(query.data?.opportunities.map((o) => [o.id, o.fields.title])), [query.data])
  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.entries.length === 0)
    body = (
      <>
        <StateView
          state="empty"
          icon={<Icons.heart aria-hidden />}
          title={t("planEmptyTitle")}
          description={t("planEmptyText", { from: grades[0] ?? 9, to: grades[grades.length - 1] ?? 12 })}
          action={
            <Link href="/opportunities/" className={buttonVariants()}>
              {t("browse")}
            </Link>
          }
        />
        <PersonalFinds entries={query.data.personal} />
      </>
    )
  else {
    const plan = query.data
    const conflicts = plan.analytics.conflicts
    body = (
      <>
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
        <Board plan={plan} />
        <PersonalFinds entries={plan.personal} />
      </>
    )
  }
  return <div className={pageClass()}>{body}</div>
}
