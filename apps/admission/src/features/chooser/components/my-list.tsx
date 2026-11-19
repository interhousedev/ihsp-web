"use client"

import { isApiError } from "@ihsp/api"
import { todayIso, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, cn, Icons, Pill, Reveal, SortableList, StateView, Textarea, Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { NextStep } from "../../../components/next-step"
import { careerPlanQuery } from "../../career/api"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { useAddToList, useEntryLabel, useList, usePatchEntry, useRemoveEntry } from "../hooks"
import { useWorkflow } from "../../../lib/config"
import { DeadlineChip } from "../../../components/lib/deadline-chip"
import { deadlineTone } from "../../../lib/deadline-tone"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useNow } from "../../../lib/use-now"
import type { Bucket, Deadline, ListEntry, Round } from "../types"
import { ConflictBadges, ConflictBanner } from "./list-conflicts"
import { AffordabilityPanel } from "./affordability-panel"
import { EstimateView } from "./estimate-view"
import { InstitutionCombobox } from "./institution-combobox"
import { FieldFocus } from "./field-focus"
import { useOptionLabel } from "./option-label"

/**
 * The deadline of the entry's chosen round: the next dated one, else the latest past one. A round without a dated
 * deadline says so and points to the official site when the catalog has one.
 */
export function NextDeadline({
  deadlines,
  round,
  officialUrl = null,
}: {
  deadlines: Deadline[]
  round: string
  officialUrl?: string | null
}) {
  const t = useT("chooser")
  const locale = useLocale()
  const roundLabel = useOptionLabel("round")
  const now = useNow(60_000)
  const today = todayIso(now)
  const dated = deadlines.filter((item) => item.plan === round).toSorted((a, b) => a.date.localeCompare(b.date))
  const next = dated.find((item) => item.date >= today) ?? dated.at(-1)
  if (!next)
    return (
      <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
        <span>{t("list.deadlineMissing", { round: roundLabel(round) })}</span>
        {officialUrl ? (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {t("list.officialSite")}
          </a>
        ) : null}
      </p>
    )
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${next.date}T00:00:00Z`))
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{t("list.deadline")}</span>
      <span className={cn("tabular-nums", deadlineTone(next.date, now) === "urgent" && "text-destructive font-medium")}>
        {date}
      </span>
      <DeadlineChip date={next.date} />
      <Pill>{next.plan}</Pill>
      {next.binding === true ? <Pill tone="warning">{t("list.binding")}</Pill> : null}
    </p>
  )
}

/** The inline "Add a university" row at the bottom of the list: it opens the picker and adds the pick. */
function AddSchoolRow() {
  const t = useT("chooser")
  const errorMessage = useErrorMessage()
  const list = useList()
  const add = useAddToList()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  if (!open)
    return (
      <button
        type="button"
        className="border-hairline-strong text-muted-foreground hover:text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm"
        onClick={() => setOpen(true)}
      >
        <Icons.add aria-hidden className="size-4" />
        {t("list.addSchool")}
      </button>
    )
  const listed = new Set(list.data?.map((entry) => entry.institution.id))
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <InstitutionCombobox
            autoFocus
            value={null}
            onChange={(picked) => {
              if (!picked || listed.has(picked.id) || pending) return
              setPending(true)
              add.mutate(
                { institution_id: picked.id },
                {
                  onSuccess: () => setOpen(false),
                  onSettled: () => setPending(false),
                },
              )
            }}
          />
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("list.addCancel")}
        </Button>
      </div>
      {add.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(add.error)}
        </p>
      ) : null}
    </div>
  )
}

const FEE_TONE = {
  unpaid: "neutral",
  paid: "success",
  waiver_requested: "warning",
  waiver_approved: "success",
} as const

const SELECT =
  "border-input bg-background h-11 rounded-lg border px-2 text-sm md:h-8 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

/** Where an entry leads: its university page, its essays and its documents. */
const ENTRY_LINKS = [
  { key: "university", href: (e: ListEntry) => `/chooser/institution/?id=${encodeURIComponent(e.institution.id)}` },
  { key: "essays", href: (e: ListEntry) => `/essays/?tab=colleges&entry=${encodeURIComponent(e.id)}` },
  { key: "documents", href: (e: ListEntry) => `/documents/?entry=${encodeURIComponent(e.id)}` },
] as const

function EntryRow({ entry }: { entry: ListEntry }) {
  const t = useT("chooser")
  const errorMessage = useErrorMessage()
  const bucketLabel = useOptionLabel("bucket")
  const roundLabel = useOptionLabel("round")
  const countryLabel = useOptionLabel("country")
  const workflow = useWorkflow()
  const patch = usePatchEntry()
  const remove = useRemoveEntry()
  const [notes, setNotes] = useState(entry.notes ?? "")
  // Follow the server's value after a reload or another change instead of keeping a stale draft.
  useEffect(() => setNotes(entry.notes ?? ""), [entry.notes, entry.lock_version])
  const [open, setOpen] = useState(false)
  const change = (body: { bucket?: Bucket; round?: Round; notes?: string }) =>
    patch.mutate({ id: entry.id, body: { lock_version: entry.lock_version, ...body } })
  const error = patch.error ?? remove.error
  const gate = isApiError(error) && error.type === "admission/affordability_gate" ? error : null

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LogoAvatar
            name={entry.institution.name}
            src={entry.institution.logo_url}
            fit={entry.institution.logo_fit}
            zoom={entry.institution.logo_zoom}
            className="size-9 text-xs ring-0"
          />
          <div className="min-w-0">
            <Link
              href={`/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`}
              className="flex min-h-11 items-center text-sm font-medium hover:underline"
            >
              {entry.institution.name}
            </Link>
            <p className="text-muted-foreground text-xs">
              {[entry.institution.city, countryLabel(entry.institution.country)].filter(Boolean).join(", ")}
            </p>
            <NextDeadline
              deadlines={entry.institution.deadlines}
              round={entry.round}
              officialUrl={entry.institution.sources.find((source) => source.url)?.url ?? null}
            />
            <Pill tone={FEE_TONE[entry.fee_status]} className="mt-1 h-6 w-fit px-2 text-xs">
              {t(`list.fee.${entry.fee_status}`)}
            </Pill>
            <ConflictBadges entry={entry} />
            <nav
              aria-label={t("list.links.label", { name: entry.institution.name })}
              className="flex flex-wrap gap-x-3"
            >
              {ENTRY_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href(entry)}
                  className="text-primary inline-flex min-h-9 items-center text-xs underline-offset-2 hover:underline"
                >
                  {t(`list.links.${key}`)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t("list.bucket")}
            className={SELECT}
            value={entry.bucket ?? ""}
            onChange={(event) => change({ bucket: (event.target.value || undefined) as Bucket | undefined })}
          >
            <option value="">{t("list.noBucket")}</option>
            {workflow.buckets.map((bucket) => (
              <option key={bucket} value={bucket}>
                {bucketLabel(bucket)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("list.round")}
            className={SELECT}
            value={entry.round}
            onChange={(event) => change({ round: event.target.value as Round })}
          >
            {workflow.rounds.map(({ id: round }) => (
              <option key={round} value={round}>
                {roundLabel(round)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("list.remove", { name: entry.institution.name })}
            disabled={remove.isPending}
            onClick={() => remove.mutate(entry.id)}
          >
            <Icons.trash aria-hidden />
          </Button>
        </div>
      </div>
      <EstimateView estimate={entry.estimate} />
      <Button
        type="button"
        variant="link"
        size="sm"
        className="w-fit px-0"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t("list.less") : t("list.more")}
      </Button>
      {open ? (
        <Reveal className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Textarea
              aria-label={t("list.notes")}
              placeholder={t("list.notes")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => notes !== (entry.notes ?? "") && change({ notes })}
            />
          </div>
          <AffordabilityPanel entry={entry} />
        </Reveal>
      ) : null}
      {gate ? (
        <div role="alert" className="text-destructive flex flex-wrap items-center gap-2 text-xs">
          <span>{t("list.gate", { institution: String(gate.params.institution ?? entry.institution.name) })}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("afford.check")}
          </Button>
        </div>
      ) : error ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  )
}

const GROUP_TONE = { reach: "warning", target: "primary", safety: "success", none: "neutral" } as const
const GROUP_TINT = {
  reach: "bg-warning/10",
  target: "bg-primary/10",
  safety: "bg-success/10",
  none: "bg-muted",
} as const

/** The student's list in three buckets. The order inside a bucket is the student's own; it is never sorted by chance. */
export function MyList() {
  const t = useT("chooser")
  const list = useList()
  const labelOf = useEntryLabel()
  const { buckets } = useWorkflow()
  const [order, setOrder] = useState<Record<string, string[]>>({})
  const [tab, setTab] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const cycle = params.get("cycle") ?? ""
  const plan = useQuery(careerPlanQuery())
  const noField = plan.data !== undefined && (plan.data.study_focus?.labels ?? []).length === 0
  function setCycle(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set("cycle", value)
    else next.delete("cycle")
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }
  if (list.isLoading) return <StateView state="loading" rows={3} />
  if (list.isError) return <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
  const all = list.data ?? []
  const cycles = [...new Set(all.flatMap((entry) => (entry.cycle ? [entry.cycle] : [])))].toSorted()
  const entries = cycle ? all.filter((entry) => entry.cycle === cycle) : all
  if (all.length === 0)
    return (
      <div className="flex flex-col gap-4">
        {noField ? <FieldFocus /> : null}
        <StateView
          state="empty"
          icon={<Icons.search className="size-8" aria-hidden />}
          title={t("list.emptyTitle")}
          description={t("list.emptyText")}
          action={
            <Link
              href="/chooser/search/"
              className="text-primary inline-flex min-h-11 items-center text-sm underline-offset-2 hover:underline"
            >
              {t("list.find")}
            </Link>
          }
        />
        <AddSchoolRow />
      </div>
    )
  const groups: { key: Bucket | "none"; entries: ListEntry[] }[] = [
    ...buckets.map((bucket) => ({
      key: bucket as Bucket,
      entries: entries.filter((entry) => labelOf(entry) === bucket),
    })),
    { key: "none" as const, entries: entries.filter((entry) => !buckets.some((bucket) => bucket === labelOf(entry))) },
  ]
  const sorted = (key: string, items: ListEntry[]) => {
    const ids = order[key] ?? []
    const rank = (entry: ListEntry) => (ids.includes(entry.id) ? ids.indexOf(entry.id) : ids.length)
    return items.toSorted((a, b) => rank(a) - rank(b))
  }
  const noSafety = groups.find((group) => group.key === "safety")?.entries.length === 0

  const visible = groups.filter((group) => group.key !== "none" || group.entries.length > 0)
  const active =
    visible.find((group) => group.key === tab) ?? visible.find((group) => group.entries.length > 0) ?? visible[0]

  return (
    <SplitLayout
      aside={
        <>
          <AsideCard title={t("list.view.summaryTitle")} icon={<Icons.homework aria-hidden className="size-4" />}>
            <Pill tone="primary" className="self-start">
              {t("list.view.total", { count: entries.length })}
            </Pill>
            <ul className="flex flex-col gap-2">
              {visible.map((group) => (
                <li key={group.key} className={cn("flex items-start gap-3 rounded-lg p-2", GROUP_TINT[group.key])}>
                  <span className="text-lg font-semibold tabular-nums">{group.entries.length}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{t(`list.groups.${group.key}`)}</span>
                    <span className="text-muted-foreground text-xs">{t(`list.view.hint.${group.key}`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </AsideCard>
          {noSafety ? (
            <Alert>
              <Icons.info aria-hidden />
              <AlertDescription>{t("list.noSafety")}</AlertDescription>
            </Alert>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {noField ? <FieldFocus /> : null}
        <ConflictBanner entries={all} />
        {cycles.length > 0 ? (
          <label className="flex items-center gap-2 text-sm">
            {t("list.cycle")}
            <select className={SELECT} value={cycle} onChange={(event) => setCycle(event.target.value)}>
              <option value="">{t("filters.any")}</option>
              {cycles.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <UnderlineTabs
          label={t("list.view.tabs")}
          value={active.key}
          onValueChange={setTab}
          tabs={visible.map((group) => ({
            value: group.key,
            label: t(`list.groups.${group.key}`),
            count: group.entries.length,
            tone: GROUP_TONE[group.key],
          }))}
        />
        <section aria-label={t(`list.groups.${active.key}`)} className="flex flex-col gap-2">
          {active.entries.length === 0 ? (
            <StateView
              state="empty"
              icon={<Icons.homework aria-hidden />}
              title={t(`list.groups.${active.key}`)}
              description={t("list.groupEmpty")}
            />
          ) : (
            <ScrollFade maxHeight="75vh">
              <SortableList
                items={sorted(active.key, active.entries)}
                label={t(`list.groups.${active.key}`)}
                handleLabel={t("list.drag")}
                onReorder={(next) =>
                  setOrder((current) => ({ ...current, [active.key]: next.map((entry) => entry.id) }))
                }
                renderItem={(entry) => <EntryRow entry={entry} />}
              />
            </ScrollFade>
          )}
        </section>
        <AddSchoolRow />
        <div className="flex flex-col gap-2 md:flex-row">
          <NextStep href="/chooser/budget/" label={t("list.next.budget")} className="md:flex-1" />
          <NextStep
            href="/essays/?tab=colleges"
            label={t("list.next.essays", { count: all.length })}
            className="md:flex-1"
          />
        </div>
      </div>
    </SplitLayout>
  )
}
