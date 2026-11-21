"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { NextStep } from "../../../components/next-step"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useChecklist, usePatchChecklist, type ChecklistItem } from "../api"
import { groupChecklist, QUADRANTS, SORTS, sortChecklist, type ChecklistSort } from "../priority"

const DONE = "done"
const TODO = "todo"

type View = "list" | "matrix"

function ItemLinks({ item }: { item: ChecklistItem }) {
  const t = useT("documents")
  if (!item.app_path && !item.source_url) return null
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-x-4 text-xs">
      {item.app_path && (
        <Link
          href={item.app_path}
          className="text-primary inline-flex min-h-11 items-center font-medium md:min-h-0 underline-offset-2 hover:underline"
        >
          {t("openPage")}
        </Link>
      )}
      {item.source_url && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex min-h-11 items-center gap-1 font-medium md:min-h-0 underline-offset-2 hover:underline"
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
    <li className="relative flex items-start gap-3 py-2">
      {/* The checkbox's hit area is stretched over the whole row; links and buttons sit above it. */}
      <Checkbox
        className="static after:absolute after:inset-0 after:cursor-pointer"
        aria-label={item.institution_name ? `${title} · ${item.institution_name}` : title}
        checked={done}
        disabled={patch.isPending}
        onCheckedChange={(checked) => send({ id: item.id, status: checked ? DONE : TODO })}
      />
      {item.institution_name ? (
        <LogoAvatar
          name={item.institution_name}
          src={item.logo_url}
          fit={item.logo_fit}
          zoom={item.logo_zoom}
          className="size-8 ring-0"
        />
      ) : null}
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
            className="relative z-10 min-h-11 md:min-h-8"
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

/** Items grouped by institution (general ones first), each group collapsible; only the first starts open. */
function groupByInstitution(
  items: readonly ChecklistItem[],
): { name: string; items: ChecklistItem[]; logo: ChecklistItem }[] {
  const groups = new Map<string, ChecklistItem[]>()
  for (const item of items) {
    const name = item.institution_name ?? ""
    groups.set(name, [...(groups.get(name) ?? []), item])
  }
  return [...groups]
    .map(([name, list]) => ({ name, items: list, logo: list[0] }))
    .sort((a, b) => Number(b.name === "") - Number(a.name === ""))
}

/** The earliest deadline of the group's open items. */
function nextDeadline(items: readonly ChecklistItem[]): string | null {
  const dates = items.filter((item) => item.status !== DONE && item.due_utc).map((item) => item.due_utc as string)
  return dates.length ? dates.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b)) : null
}

function InstitutionGroup({
  group,
  defaultOpen,
  focused,
}: {
  group: ReturnType<typeof groupByInstitution>[number]
  defaultOpen: boolean
  focused: boolean
}) {
  const t = useT("documents")
  const { date } = useFormatters()
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    if (!focused || !ref.current) return
    ref.current.open = true
    ref.current.scrollIntoView?.({ block: "center" })
  }, [focused])
  const deadline = nextDeadline(group.items)
  const portal = group.items.find((item) => item.institution_website_url)?.institution_website_url
  return (
    <details
      ref={ref}
      open={defaultOpen || focused}
      data-focused={focused || undefined}
      className={`group py-1 ${focused ? "bg-accent/40 rounded-card" : ""}`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <Icons.chevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />
        {group.name ? (
          <LogoAvatar
            name={group.name}
            src={group.logo.logo_url}
            fit={group.logo.logo_fit}
            zoom={group.logo.logo_zoom}
            className="size-6 ring-0"
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{group.name || t("groupGeneral")}</span>
        {group.name && deadline ? (
          <span className="text-muted-foreground hidden text-xs font-normal sm:inline">
            {t("nextDeadline", { date: date(deadline) })}
          </span>
        ) : null}
        <span className="text-muted-foreground text-xs font-normal">
          {group.items.filter((item) => item.status === DONE).length}/{group.items.length}
        </span>
      </summary>
      {group.name && (deadline || portal) ? (
        <div className="flex flex-wrap items-center gap-x-4 ps-6 text-xs">
          {deadline ? (
            <span className="text-muted-foreground sm:hidden">{t("nextDeadline", { date: date(deadline) })}</span>
          ) : null}
          {portal ? (
            <a
              href={portal}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex min-h-11 items-center gap-1 font-medium underline-offset-2 hover:underline md:min-h-0"
            >
              {t("openPortal")}
              <Icons.externalLink aria-hidden className="size-3.5" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          ) : null}
        </div>
      ) : null}
      <ul className="divide-y" aria-label={group.name || t("groupGeneral")}>
        {group.items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
    </details>
  )
}

function ChecklistGroups({ items }: { items: readonly ChecklistItem[] }) {
  const entry = useSearchParams().get("entry")
  const groups = groupByInstitution(items)
  const focusedIndex = entry ? groups.findIndex((g) => g.items.some((i) => i.list_entry_id === entry)) : -1
  return (
    <div className="flex flex-col divide-y">
      {groups.map((group, index) => (
        <InstitutionGroup
          key={group.name}
          group={group}
          defaultOpen={focusedIndex < 0 && index === 0}
          focused={index === focusedIndex}
        />
      ))}
    </div>
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
  if (query.data.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <StateView state="empty" title={t("checklistEmpty")} />
        <NextStep href="/chooser/?step=match" label={t("nextSearch")} hint={t("nextSearchHint")} />
      </div>
    )
  }
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
          <ChecklistGroups items={sortChecklist(query.data, sort)} />
        )}
      </div>
    </div>
  )
}
