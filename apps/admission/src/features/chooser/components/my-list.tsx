"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, Reveal, SortableList, StateView, Textarea } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useList, usePatchEntry, useRemoveEntry } from "../hooks"
import { useWorkflow } from "../../../lib/config"
import type { Bucket, ListEntry } from "../types"
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
  const workflow = useWorkflow()
  const patch = usePatchEntry()
  const remove = useRemoveEntry()
  const [notes, setNotes] = useState(entry.notes ?? "")
  const [open, setOpen] = useState(false)
  const change = (body: { bucket?: Bucket; round?: ListEntry["round"]; notes?: string }) =>
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
            {[entry.institution.city, entry.institution.country].filter(Boolean).join(", ")}
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
            onChange={(event) => change({ round: event.target.value as ListEntry["round"] })}
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

/** The student's list in three buckets. The order inside a bucket is the student's own; it is never sorted by chance. */
export function MyList() {
  const t = useT("chooser")
  const list = useList()
  const { buckets } = useWorkflow()
  const [order, setOrder] = useState<Record<string, string[]>>({})
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
    return [...items].sort((a, b) => rank(a) - rank(b))
  }
  const noSafety = groups.find((group) => group.key === "safety")?.entries.length === 0

  return (
    <div className="flex flex-col gap-6">
      {noSafety ? (
        <Alert>
          <Icons.info aria-hidden />
          <AlertDescription>{t("list.noSafety")}</AlertDescription>
        </Alert>
      ) : null}
      {groups
        .filter((group) => group.key !== "none" || group.entries.length > 0)
        .map((group) => (
          <section key={group.key} className="flex flex-col gap-2" aria-label={t(`list.groups.${group.key}`)}>
            <h3 className="text-sm font-semibold">
              {t(`list.groups.${group.key}`)}{" "}
              <span className="text-muted-foreground font-normal">({group.entries.length})</span>
            </h3>
            {group.entries.length === 0 ? (
              <p className="text-muted-foreground text-xs">{t("list.groupEmpty")}</p>
            ) : (
              <SortableList
                items={sorted(group.key, group.entries)}
                label={t(`list.groups.${group.key}`)}
                handleLabel={t("list.drag")}
                onReorder={(next) =>
                  setOrder((current) => ({ ...current, [group.key]: next.map((entry) => entry.id) }))
                }
                renderItem={(entry) => <EntryRow entry={entry} />}
              />
            )}
          </section>
        ))}
    </div>
  )
}
