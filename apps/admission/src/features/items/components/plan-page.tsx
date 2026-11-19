"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { ApiError } from "@ihsp/api"
import { Alert, AlertDescription, Button, buttonVariants, Icons, Input, Label, PageHeader, StateView } from "@ihsp/ui"
import { AiTabCard } from "@/components/ai-tab-card"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useScreenContext } from "../../assistant/screen-context"
import { PlanBody as OpportunityPlanBody } from "../../opportunities/components/plan-page"
import { useItems } from "../api"
import { parseMonth } from "./item-fields"
import {
  MILESTONE_STATUSES,
  useCreateMilestone,
  useDeleteMilestone,
  useGoalPlan,
  usePatchMilestone,
  usePutGoalPlan,
  useSuggestMilestones,
  type Suggestion,
  type Milestone,
} from "../goal-plan"

const MAX_MILESTONES = 12
function Suggest({ milestones }: { milestones: Milestone[] }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const suggest = useSuggestMilestones()
  const put = usePutGoalPlan()
  const [pending, setPending] = useState<Suggestion[]>([])
  const [accepted, setAccepted] = useState<Suggestion[]>([])
  const err = suggest.error instanceof ApiError ? suggest.error : null
  const room = MAX_MILESTONES - milestones.length - accepted.length
  const run = () =>
    suggest.mutate(undefined, {
      onSuccess: (d) => {
        setPending(d.items)
        setAccepted([])
      },
    })
  const save = () =>
    put.mutate(
      [
        ...milestones.map((m) => ({
          id: m.id,
          title: m.title,
          item_id: m.item_id,
          due_month: m.due_month,
          target_value: m.target_value === null ? null : Number(m.target_value),
          status: m.status,
        })),
        ...accepted.map((a) => ({ title: a.title, item_id: a.item_id, due_month: a.due_month })),
      ],
      {
        onSuccess: () => {
          setAccepted([])
          setPending([])
        },
      },
    )
  return (
    <AiTabCard role="region" label={t("plan.suggestTab")} icon={<Icons.sparkles aria-hidden />} className="gap-2">
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={suggest.isPending || room <= 0}
        onClick={run}
      >
        <Icons.sparkles aria-hidden />
        {t("plan.suggest")}
      </Button>
      {err?.type === "admission/consent_required" ? (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {t("plan.consent")}
            <Link href="/settings/#consent" className={buttonVariants({ size: "sm" })}>
              {t("plan.consentLink")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : err?.type === "admission/quota_exceeded" || err?.status === 429 ? (
        <Alert variant="destructive">
          <AlertDescription>{t("plan.quota")}</AlertDescription>
        </Alert>
      ) : suggest.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(suggest.error)}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {pending.map((s, i) => (
          <li
            key={`${s.title}-${i}`}
            className="border-hairline flex flex-wrap items-center justify-between gap-2 rounded-card border border-dashed p-3 animate-in fade-in"
          >
            <span className="text-sm">
              {s.title} <span className="text-muted-foreground">· {s.due_month.slice(0, 7)}</span>
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={room <= 0}
                onClick={() => {
                  setAccepted((a) => [...a, s])
                  setPending((p) => p.filter((x) => x !== s))
                }}
              >
                {t("plan.accept")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPending((p) => p.filter((x) => x !== s))}
              >
                {t("plan.dismiss")}
              </Button>
            </span>
          </li>
        ))}
      </ul>
      {accepted.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t("plan.accepted", { count: accepted.length })}</p>
          {put.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(put.error)}
            </p>
          ) : null}
          <Button type="button" className="self-start" disabled={put.isPending} onClick={save}>
            {t("plan.savePlan")}
          </Button>
        </div>
      ) : null}
    </AiTabCard>
  )
}

const monthKey = (m: Milestone) => m.due_month?.slice(0, 7) ?? ""

function MilestoneAdd({ items }: { items: { id: string; title: string }[] }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const create = useCreateMilestone()
  const [title, setTitle] = useState("")
  const [month, setMonth] = useState("")
  const [itemId, setItemId] = useState("")
  const [target, setTarget] = useState("")
  const monthValue = parseMonth(month)
  const monthInvalid = month.trim() !== "" && monthValue === null
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (monthInvalid) return
    create.mutate(
      {
        title: title.trim(),
        due_month: monthValue,
        item_id: itemId || null,
        target_value: target.trim() && Number.isFinite(Number(target)) ? Number(target) : null,
      },
      {
        onSuccess: () => {
          setTitle("")
          setMonth("")
          setItemId("")
          setTarget("")
        },
      },
    )
  }
  return (
    <form onSubmit={submit} className="border-hairline flex flex-col gap-3 rounded-card border p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="ms-title">{t("plan.milestone")}</Label>
        <Input id="ms-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="ms-target">{t("plan.target")}</Label>
          <Input
            id="ms-target"
            type="number"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ms-month">{t("plan.month")}</Label>
          <Input
            id="ms-month"
            placeholder="YYYY-MM"
            inputMode="numeric"
            aria-invalid={monthInvalid || undefined}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          {monthInvalid ? <p className="text-destructive text-xs">{t("plan.monthInvalid")}</p> : null}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ms-item">{t("plan.item")}</Label>
          <select
            id="ms-item"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="border-input bg-background h-11 rounded-lg border px-2 text-sm"
          >
            <option value="">{t("plan.noItem")}</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={!title.trim() || monthInvalid || create.isPending}>
        {t("plan.add")}
      </Button>
    </form>
  )
}

function MilestoneRow({ m, itemTitle }: { m: Milestone; itemTitle: string | null }) {
  const t = useT("items")
  const patch = usePatchMilestone()
  const del = useDeleteMilestone()
  const router = useRouter()
  const addHref = `/activities/?item=new&from=${encodeURIComponent(m.id)}`
  return (
    <li className="border-hairline flex flex-col gap-2 rounded-card border p-3 animate-in fade-in">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={m.status === "planned" ? "font-medium" : "text-muted-foreground font-medium line-through"}>
          {m.title}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("plan.remove", { title: m.title })}
          disabled={del.isPending}
          onClick={() => del.mutate(m.id)}
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      {m.target_value ? (
        <p className="text-muted-foreground text-sm tabular-nums">
          {t("plan.targetValue", { value: Number(m.target_value) })}
        </p>
      ) : null}
      {itemTitle && m.item_id ? (
        <Link href={`/activities/?item=${encodeURIComponent(m.item_id)}`} className="text-sm underline">
          {itemTitle}
        </Link>
      ) : null}
      {m.status === "done" ? (
        <Link href={addHref} className={buttonVariants({ size: "sm", variant: "outline", className: "w-fit" })}>
          {t("plan.addToAchievements")}
        </Link>
      ) : null}
      <div role="group" aria-label={t("plan.status")} className="flex flex-wrap gap-2">
        {MILESTONE_STATUSES.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={m.status === s ? "default" : "outline"}
            aria-pressed={m.status === s}
            disabled={patch.isPending}
            onClick={() =>
              m.status !== s &&
              patch.mutate(
                { id: m.id, lock_version: m.lock_version, status: s },
                {
                  onSuccess: () => {
                    if (s === "done")
                      toast(t("plan.doneToast"), {
                        action: { label: t("plan.addToAchievements"), onClick: () => router.push(addHref) },
                      })
                  },
                },
              )
            }
          >
            {t(`plan.statuses.${s}`)}
          </Button>
        ))}
      </div>
    </li>
  )
}

/** Milestone timeline by month, linked to items, plus the projected numbers of each item. */
export function PlanBody() {
  const t = useT("items")
  const items = useItems()
  const plan = useGoalPlan()
  const milestones = plan.data?.items ?? []
  const titles = new Map((items.data ?? []).map((i) => [i.id, i.title]))
  const months = [...new Set(milestones.map(monthKey))].sort((a, b) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
  )
  const planned = (items.data ?? []).filter((i) => i.metrics.some((m) => m.horizon === "projected"))
  useScreenContext({
    title: t("plan.title"),
    summary: `Goal plan: ${milestones.length} milestones, ${planned.length} items with projected numbers. Items: ${(
      items.data ?? []
    )
      .map((i) => i.title)
      .join("; ")}`,
  })
  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <PageHeader title={t("plan.title")} />
        {plan.isPending ? <StateView state="loading" /> : null}
        {plan.isError ? <StateView state="error" error={plan.error} onRetry={() => plan.refetch()} /> : null}
        {plan.isSuccess && milestones.length === 0 ? (
          <StateView
            state="empty"
            title={t("plan.emptyTitle")}
            description={t("plan.emptyText")}
            icon={<Icons.calendar aria-hidden />}
          />
        ) : null}
        {months.map((month) => (
          <section key={month || "none"} aria-labelledby={`m-${month || "none"}`} className="flex flex-col gap-2">
            <h2 id={`m-${month || "none"}`} className="text-sm font-medium">
              {month
                ? new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                : t("plan.noMonth")}
            </h2>
            <ul className="flex flex-col gap-2">
              {milestones
                .filter((m) => monthKey(m) === month)
                .map((m) => (
                  <MilestoneRow key={m.id} m={m} itemTitle={m.item_id ? (titles.get(m.item_id) ?? null) : null} />
                ))}
            </ul>
          </section>
        ))}
        {plan.isSuccess ? <Suggest milestones={milestones} /> : null}
        {milestones.length >= MAX_MILESTONES ? (
          <p className="text-muted-foreground text-sm">{t("plan.cap", { max: MAX_MILESTONES })}</p>
        ) : (
          <MilestoneAdd items={(items.data ?? []).map((i) => ({ id: i.id, title: i.title }))} />
        )}
        {planned.length ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t("plan.projected")}</h2>
            <ul className="flex flex-col gap-2">
              {planned.map((item) => (
                <li key={item.id} className="border-hairline flex flex-col gap-1 rounded-card border p-3 text-sm">
                  <Link
                    href={`/activities/?item=${encodeURIComponent(item.id)}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.metrics
                    .filter((m) => m.horizon === "projected")
                    .map((m) => (
                      <span key={m.id} className="text-muted-foreground tabular-nums">
                        {m.label}: {m.value} {m.unit}
                        {m.target_date ? ` · ${m.target_date}` : ""}
                      </span>
                    ))}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}

const VIEWS = ["milestones", "saved"] as const

/** Milestones and the saved opportunities in one page, switched by `?view=saved`. */
export function PlanPage() {
  const t = useT("items")
  const router = useRouter()
  const view = useSearchParams().get("view") === "saved" ? "saved" : "milestones"
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 md:px-6 md:pt-6">
        <UnderlineTabs
          label={t("plan.view.label")}
          value={view}
          onValueChange={(next) => {
            if (next !== view && VIEWS.some((v) => v === next)) {
              router.replace(next === "saved" ? "/plan/?view=saved" : "/plan/")
            }
          }}
          tabs={VIEWS.map((v) => ({ value: v, label: t(`plan.view.${v}`) }))}
        />
      </div>
      {view === "saved" ? <OpportunityPlanBody /> : <PlanBody />}
    </AdmissionShell>
  )
}
