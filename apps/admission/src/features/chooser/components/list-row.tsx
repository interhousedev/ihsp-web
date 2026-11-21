"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, cn, Icons, Pill, Reveal } from "@ihsp/ui"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { useWorkflow } from "../../../lib/config"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { RingLogo } from "../../fit/components/ring-logo"
import { usePatchEntry } from "../hooks"
import { usePlanTasks } from "../use-plan"
import { sourceHost } from "./fact-source"
import { formatCompactCurrency } from "./money"
import type { ListRow } from "../use-list-rows"
import type { Bucket, Round } from "../types"
import { EntryDetails } from "./entry-details"
import { ConflictBadges } from "./list-conflicts"
import { NextDeadline } from "./next-deadline"
import { useOptionLabel } from "./option-label"

/** Columns of the table; below the container's `xl` width a row is a card instead. */
export const LIST_COLUMNS = "@xl:grid-cols-[minmax(9rem,1fr)_6.5rem_2.75rem_6rem_3.75rem_4.25rem]"

const SELECT =
  "border-input bg-background h-11 w-full min-w-0 rounded-lg border px-2 text-sm @xl:h-8 @xl:px-1.5 @xl:text-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

const LABELS = ["reach", "target", "safety"] as const

function Cell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-muted-foreground text-xs @xl:hidden">{label}</span>
      {children}
    </div>
  )
}

/** Column headings of the table, only where rows are a table. */
export function ListHead() {
  const t = useT("uniList")
  return (
    <div
      aria-hidden
      className={cn(
        "text-muted-foreground hidden gap-x-2 border-b px-3 pb-2 text-xs font-medium @xl:grid",
        LIST_COLUMNS,
      )}
    >
      <span>{t("col.university")}</span>
      <span>{t("col.cost")}</span>
      <span>{t("col.chance")}</span>
      <span>{t("col.label")}</span>
      <span>{t("col.round")}</span>
      <span />
    </div>
  )
}

/** The cost of a row: "≈ $12.4K" after aid (or the sticker price, said so), the gap to the family budget, provenance. */
function CostCell({ row }: { row: ListRow }) {
  const t = useT("uniList")
  const locale = useLocale()
  const { cost, gap, unverified } = row
  if (!cost) return <span className="text-muted-foreground text-sm">{t("unknown")}</span>
  const amount = formatCompactCurrency(cost.amount, cost.currency, locale)
  return (
    <>
      <span className="text-sm font-medium tabular-nums">
        {cost.kind === "net" ? t("approx", { amount }) : amount}
        {cost.kind === "sticker" ? <span className="text-muted-foreground ms-1 text-xs font-normal">{t("sticker")}</span> : null}
      </span>
      {gap !== null ? (
        <span className={cn("text-xs tabular-nums", gap > 0 ? "text-destructive" : "text-success")}>
          {gap > 0
            ? t("over", { amount: formatCompactCurrency(gap, cost.currency, locale) })
            : t("under", { amount: formatCompactCurrency(-gap, cost.currency, locale) })}
        </span>
      ) : null}
      {unverified ? (
        <span className="text-muted-foreground text-xs">
          {t(unverified.sourceUrl ? "unverified" : "unverifiedNoSource", {
            source: unverified.sourceUrl ? sourceHost(unverified.sourceUrl) : "",
          })}
        </span>
      ) : null}
    </>
  )
}

/** One university of the list: a table row from the container's `xl` width, a card below. */
export function ListRowView({ row, onResearch }: { row: ListRow; onResearch: (row: ListRow) => void }) {
  const t = useT("uniList")
  const chooser = useT("chooser")
  const errorMessage = useErrorMessage()
  const roundLabel = useOptionLabel("round")
  const countryLabel = useOptionLabel("country")
  const workflow = useWorkflow()
  const patch = usePatchEntry()
  const plan = usePlanTasks()
  const [open, setOpen] = useState(false)
  const { entry } = row
  const name = entry.institution.name
  const change = (body: { bucket?: Bucket; round?: Round }) =>
    patch.mutate({ id: entry.id, body: { lock_version: entry.lock_version, ...body } })
  const gate = isApiError(patch.error) && patch.error.type === "admission/affordability_gate" ? patch.error : null
  const detailsId = `entry-${entry.id}`
  const place = [entry.institution.city, countryLabel(entry.institution.country)].filter(Boolean).join(", ")

  return (
    <li className="bg-card @xl:bg-transparent flex min-w-0 flex-col gap-2 rounded-xl border p-3 @xl:rounded-none @xl:border-0 @xl:border-b @xl:py-2.5">
      <div className={cn("grid min-w-0 grid-cols-2 items-start gap-x-2 gap-y-3 @xl:items-center", LIST_COLUMNS)}>
        <div className="col-span-2 flex min-w-0 items-center gap-3 @xl:col-span-1">
          <FitRingButton name={name} fit={row.fit} size={44}>
            <RingLogo name={name} src={entry.institution.logo_url} />
          </FitRingButton>
          <div className="min-w-0 flex-1">
            <Link
              href={`/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`}
              className="line-clamp-2 text-sm leading-snug font-medium hover:underline"
            >
              {name}
            </Link>
            <p className="text-muted-foreground text-xs">
              {row.fit.total === null ? t("fitUnknown") : t("fit", { value: Math.round(row.fit.total) })}
              {place ? <span className="@xl:hidden">{` · ${place}`}</span> : null}
            </p>
            <ConflictBadges entry={entry} />
          </div>
        </div>
        <Cell label={t("col.cost")}>
          <CostCell row={row} />
        </Cell>
        <Cell label={t("col.chance")}>
          <span className="text-sm tabular-nums">{row.chance === null ? "–" : `${Math.round(row.chance)}%`}</span>
        </Cell>
        <Cell label={t("col.label")}>
          {row.label === "home" ? (
            <Pill tone="success" className="h-6 w-fit px-2 text-xs">
              {t("home")}
            </Pill>
          ) : (
            <select
              aria-label={t("labelFor", { name })}
              className={SELECT}
              value={row.label ?? ""}
              onChange={(event) => change({ bucket: (event.target.value || undefined) as Bucket | undefined })}
            >
              <option value="">{t("noLabel")}</option>
              {LABELS.map((label) => (
                <option key={label} value={label}>
                  {chooser(`list.groups.${label}`)}
                </option>
              ))}
            </select>
          )}
        </Cell>
        <Cell label={t("col.round")}>
          <select
            aria-label={t("roundFor", { name })}
            className={SELECT}
            value={entry.round}
            onChange={(event) => change({ round: event.target.value as Round })}
          >
            {workflow.rounds.map(({ id }) => (
              <option key={id} value={id}>
                {roundLabel(id)}
              </option>
            ))}
          </select>
        </Cell>
        <div className="order-last col-span-2 flex items-center justify-end gap-1 @xl:order-none @xl:col-span-1">
          {row.missing.length > 0 ? (
            <Button type="button" variant="outline" size="sm" className="@xl:size-8 @xl:px-0" title={t("research")} onClick={() => onResearch(row)}>
              <Icons.sparkles aria-hidden />
              <span className="@xl:sr-only">{t("research")}</span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={open ? t("less", { name }) : t("more", { name })}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <Icons.chevronUp aria-hidden /> : <Icons.chevronDown aria-hidden />}
          </Button>
        </div>
        <Cell label={t("col.deadline")} className="col-span-2 @xl:col-span-full @xl:flex-row @xl:flex-wrap @xl:items-center @xl:gap-x-3 @xl:ps-14">
          <NextDeadline
            deadlines={entry.institution.deadlines}
            round={entry.round}
            nextDeadline={entry.institution.next_deadline ?? null}
            officialUrl={entry.institution.sources.find((source) => source.url)?.url ?? null}
            compact
          />
          <span className="text-muted-foreground text-xs tabular-nums">
            {row.tasks.total > 0 ? t("tasks", { done: row.tasks.done, total: row.tasks.total }) : t("noTasks")}
          </span>
          {row.tasks.total === 0 ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto w-fit justify-start px-0 text-xs"
              disabled={plan.isPending}
              onClick={() => plan.mutate(entry)}
            >
              {t("plan.create")}
            </Button>
          ) : null}
        </Cell>
      </div>
      {gate ? (
        <div role="alert" className="text-destructive flex flex-wrap items-center gap-2 text-xs">
          <span>{chooser("list.gate", { institution: String(gate.params.institution ?? name) })}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {chooser("afford.check")}
          </Button>
        </div>
      ) : (patch.error ?? plan.error) ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(patch.error ?? plan.error)}
        </p>
      ) : null}
      {open ? (
        <Reveal id={detailsId}>
          <EntryDetails entry={entry} budget={row.budget} />
        </Reveal>
      ) : null}
    </li>
  )
}
