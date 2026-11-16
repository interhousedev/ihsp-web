"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useChecklist, usePatchChecklist, type ChecklistItem } from "../api"
import { groupChecklist, QUADRANTS, SORTS, sortChecklist, type ChecklistSort } from "../priority"

const DONE = "done"
const TODO = "todo"

type View = "list" | "matrix"

function ItemLinks({ item }: { item: ChecklistItem }) {
  const t = useT("documents")
  if (!item.app_path && !item.source_url) return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {item.app_path && (
        <Link href={item.app_path} className="text-primary font-medium underline-offset-2 hover:underline">
          {t("openPage")}
        </Link>
      )}
      {item.source_url && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
        >
          {t("openLink")}
          <Icons.externalLink aria-hidden className="size-3.5" />
          <span className="sr-only">{t("newTab")}</span>
        </a>
      )}
    </div>
  )
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const t = useT("documents")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const patch = usePatchChecklist()
  const title = t.has(`checklist.${item.title_key}`) ? t(`checklist.${item.title_key}`) : item.title_key
  const done = item.status === DONE
  const send = (body: Parameters<typeof patch.mutate>[0]) =>
    patch.mutate(body, { onError: (error) => toast.error(errorMessage(error)) })
  return (
    <li className="flex items-start gap-3 py-2">
      <Checkbox
        aria-label={item.institution_name ? `${title} · ${item.institution_name}` : title}
        checked={done}
        disabled={patch.isPending}
        onCheckedChange={(checked) => send({ id: item.id, status: checked ? DONE : TODO })}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={done ? "text-muted-foreground line-through" : "font-medium"}>
          {title}
          {item.institution_name ? ` · ${item.institution_name}` : ""}
        </span>
        <span className="text-muted-foreground text-xs">
          {t(`owner.${item.owner}`)}
          {item.due_utc ? ` · ${t("due", { date: date(item.due_utc) })}` : ""}
        </span>
        <ItemLinks item={item} />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        {item.urgent && <StatusBadge tone="warning" label={t("priority.urgent")} />}
        {!done && item.status !== TODO && <StatusBadge tone="neutral" label={t(`checklistStatus.${item.status}`)} />}
        {!done && (
          <Button
            type="button"
            size="sm"
            variant={item.important ? "default" : "outline"}
            aria-pressed={item.important}
            disabled={patch.isPending}
            onClick={() => send({ id: item.id, important: !item.important })}
          >
            {t("priority.important")}
          </Button>
        )}
      </div>
    </li>
  )
}

function Pills<T extends string>({
  value,
  options,
  label,
  render,
  onChange,
}: {
  value: T
  options: readonly T[]
  label: string
  render: (o: T) => string
  onChange: (o: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((o) => (
        <Button
          key={o}
          type="button"
          size="sm"
          variant={o === value ? "default" : "outline"}
          aria-pressed={o === value}
          onClick={() => onChange(o)}
        >
          {render(o)}
        </Button>
      ))}
    </div>
  )
}

/** The student checklist: a sortable list or an Eisenhower matrix (important x urgent). */
export function ChecklistSection() {
  const t = useT("documents")
  const query = useChecklist()
  const [view, setView] = useState<View>("list")
  const [sort, setSort] = useState<ChecklistSort>("urgency")
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("checklistEmpty")} />
  const groups = view === "matrix" ? groupChecklist(query.data) : null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Pills
          value={view}
          options={["list", "matrix"] as const}
          label={t("view.label")}
          render={(o) => t(`view.${o}`)}
          onChange={setView}
        />
        {view === "list" && (
          <Pills
            value={sort}
            options={SORTS}
            label={t("sort.label")}
            render={(o) => t(`sort.${o}`)}
            onChange={setSort}
          />
        )}
      </div>
      <div role="region" aria-label={t("checklistTitle")} className="rounded-card border px-3">
        {groups ? (
          QUADRANTS.map((q) => (
            <section key={q} aria-labelledby={`quadrant-${q}`} className="py-2">
              <h3 id={`quadrant-${q}`} className="text-sm font-semibold">
                {t(`quadrant.${q}`)} <span className="text-muted-foreground font-normal">({groups[q].length})</span>
              </h3>
              {groups[q].length === 0 ? (
                <p className="text-muted-foreground py-1 text-xs">{t("quadrantEmpty")}</p>
              ) : (
                <ul className="divide-y">
                  {groups[q].map((item) => (
                    <ChecklistRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          ))
        ) : (
          <ul className="divide-y" aria-label={t("checklistTitle")}>
            {sortChecklist(query.data, sort).map((item) => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
