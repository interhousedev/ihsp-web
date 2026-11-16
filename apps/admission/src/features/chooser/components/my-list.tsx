"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, cn, Icons, Pill, Reveal, SortableList, StateView, Textarea, Button } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { useList, usePatchEntry, useRemoveEntry } from "../hooks"
import { useWorkflow } from "../../../lib/config"
import type { Bucket, ListEntry, Round } from "../types"
import { AffordabilityPanel } from "./affordability-panel"
import { EstimateView } from "./estimate-view"
import { useOptionLabel } from "./option-label"

const SELECT =
  "border-input bg-background h-11 rounded-lg border px-2 text-sm md:h-8 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

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
  const [open, setOpen] = useState(false)
  const change = (body: { bucket?: Bucket; round?: Round; notes?: string }) =>
    patch.mutate({ id: entry.id, body: { lock_version: entry.lock_version, ...body } })
  const error = patch.error ?? remove.error

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`}
            className="font-medium hover:underline"
          >
            {entry.institution.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {[entry.institution.city, countryLabel(entry.institution.country)].filter(Boolean).join(", ")}
          </p>
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
      {error ? (
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
  const { buckets } = useWorkflow()
  const [order, setOrder] = useState<Record<string, string[]>>({})
  const [tab, setTab] = useState("")
  if (list.isLoading) return <StateView state="loading" rows={3} />
  if (list.isError) return <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
  const entries = list.data ?? []
  if (entries.length === 0)
    return (
      <StateView
        state="empty"
        icon={<Icons.search className="size-8" aria-hidden />}
        title={t("list.emptyTitle")}
        description={t("list.emptyText")}
        action={
          <Link href="/chooser/search/" className="text-primary text-sm underline-offset-2 hover:underline">
            {t("list.find")}
          </Link>
        }
      />
    )
  const groups: { key: Bucket | "none"; entries: ListEntry[] }[] = [
    ...buckets.map((bucket) => ({
      key: bucket as Bucket,
      entries: entries.filter((entry) => entry.bucket === bucket),
    })),
    { key: "none" as const, entries: entries.filter((entry) => entry.bucket === null) },
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
      </div>
    </SplitLayout>
  )
}
