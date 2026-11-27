"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, Icons, Input, PageContainer, ResponsiveDialog } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { QueryState } from "@ihsp/features-core"
import { AUDIENCES, KINDS, STATUSES, useActivities, useArchiveActivity, type Activity, type Audience, type Kind, type Status } from "../api"
import { ActivitiesTabs } from "./activities-tabs"
import { ActivityForm } from "./activity-form"

export const SELECT_CLASS =
  "border-input bg-background h-9 min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
const STATUS_VARIANT = { published: "success", archived: "neutral" } as const
const TODAY = "2026-11-27"

export function Logo({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  const letters = words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : name.trim().slice(0, 2)
  return (
    <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg text-sm font-semibold" aria-hidden>
      {letters.toUpperCase() || "?"}
    </span>
  )
}

const daysLeft = (d: string) => Math.round((Date.parse(d) - Date.parse(TODAY)) / 86400000)
export const shortDate = (d: string) => formatDate(d, undefined, { day: "numeric", month: "long" })

/** One catalog of opportunities shared by admission and the student cabinet (mockup). */
export function ActivitiesPage() {
  const t = useT("activities")
  const query = useActivities()
  const items = query.data ?? []
  const archive = useArchiveActivity()
  const [editing, setEditing] = useState<Activity | "new" | null>(null)
  const [kind, setKind] = useState<Kind | "">("")
  const [audience, setAudience] = useState<Audience | "">("")
  const [status, setStatusF] = useState<Status | "">("")
  const [deadline, setDeadline] = useState<"" | "soon" | "none" | "past">("")
  const [q, setQ] = useState("")
  const [sheet, setSheet] = useState(false)
  const [undo, setUndo] = useState<{ id: string; title: string } | null>(null)

  const shown = useMemo(() => {
    const rank = (a: Activity) => (a.deadline === null ? 2 : daysLeft(a.deadline) < 0 ? 3 : 1)
    return items
      .filter(
        (a) =>
          (!kind || a.kind === kind) &&
          (!audience || a.audience === audience) &&
          (!status || a.status === status) &&
          (!deadline ||
            (deadline === "none" ? a.deadline === null : a.deadline !== null && (deadline === "soon" ? daysLeft(a.deadline) >= 0 && daysLeft(a.deadline) <= 30 : daysLeft(a.deadline) < 0))) &&
          `${a.title} ${a.org}`.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .sort((x, y) => rank(x) - rank(y) || (x.deadline ?? "").localeCompare(y.deadline ?? ""))
  }, [items, kind, audience, status, deadline, q])
  const activeFilters = [kind, audience, status, deadline].filter(Boolean).length

  if (editing)
    return (
      <ActivityForm
        activity={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />
    )

  const filters = (
    <>
      <select className={SELECT_CLASS} aria-label={t("filters.kind")} value={kind} onChange={(e) => setKind(e.target.value as Kind | "")}>
        <option value="">{t("filters.allKinds")}</option>
        {KINDS.map((k) => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}
      </select>
      <select className={SELECT_CLASS} aria-label={t("filters.audience")} value={audience} onChange={(e) => setAudience(e.target.value as Audience | "")}>
        <option value="">{t("filters.allAudiences")}</option>
        {AUDIENCES.map((a) => <option key={a} value={a}>{t(`audiences.${a}`)}</option>)}
      </select>
      <select className={SELECT_CLASS} aria-label={t("filters.status")} value={status} onChange={(e) => setStatusF(e.target.value as Status | "")}>
        <option value="">{t("filters.allStatuses")}</option>
        {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
      </select>
      <select className={SELECT_CLASS} aria-label={t("filters.deadline")} value={deadline} onChange={(e) => setDeadline(e.target.value as typeof deadline)}>
        <option value="">{t("filters.anyDeadline")}</option>
        <option value="soon">{t("filters.soon")}</option>
        <option value="past">{t("filters.past")}</option>
        <option value="none">{t("filters.none")}</option>
      </select>
    </>
  )
  const reset = () => {
    setKind("")
    setAudience("")
    setStatusF("")
    setDeadline("")
  }

  return (
    <PageContainer
      title={t("title")}
      meta={t("description")}
      actions={
        <Button type="button" onClick={() => setEditing("new")}>
          <Icons.add data-icon="inline-start" aria-hidden />
          {t("create")}
        </Button>
      }
    >
      <ActivitiesTabs current="catalog" />
      <div className="flex gap-2 lg:grid lg:grid-cols-5">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("filters.search")} aria-label={t("filters.search")} className="min-h-11 flex-1 md:min-h-9" />
        <Button type="button" variant="outline" className="min-h-11 lg:hidden" onClick={() => setSheet(true)}>
          {activeFilters > 0 ? t("filters.buttonCount", { n: activeFilters }) : t("filters.button")}
        </Button>
        <div className="col-span-4 hidden grid-cols-4 gap-2 lg:grid">{filters}</div>
      </div>
      <ResponsiveDialog
        open={sheet}
        onOpenChange={setSheet}
        title={t("filters.button")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={reset}>{t("filters.reset")}</Button>
            <Button type="button" onClick={() => setSheet(false)}>{t("filters.apply", { n: shown.length })}</Button>
          </>
        }
      >
        <div className="grid gap-2">{filters}</div>
      </ResponsiveDialog>
      {undo ? (
        <div role="status" className="bg-muted flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <span className="flex-1">{t("archivedToast", { title: undo.title })}</span>
          <Button type="button" size="sm" variant="link" onClick={() => { archive.mutate({ id: undo.id, archived: false }); setUndo(null) }}>{t("undo")}</Button>
        </div>
      ) : null}
      <QueryState query={query}>
        {() => (
      <>
      <p className="text-muted-foreground text-sm">{t("count", { n: shown.length })}</p>
      {shown.length === 0 ? (
        <div className="grid justify-items-center gap-2 py-8 text-center">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
          <Button type="button" variant="outline" onClick={() => { reset(); setQ("") }}>{t("filters.reset")}</Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {shown.map((a) => {
            const d = a.deadline ? daysLeft(a.deadline) : null
            return (
              <li key={a.id} className="min-w-0">
                <Card className="min-w-0">
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <Logo name={a.org} />
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {a.org}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 lg:w-72">
                      <Badge variant="outline">{t(`kinds.${a.kind}`)}</Badge>
                      <Badge variant="info">{t(`audiences.${a.audience}`)}</Badge>
                      <Badge variant={STATUS_VARIANT[a.status]}>{t(`statuses.${a.status}`)}</Badge>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-1.5 text-sm sm:w-44">
                      {a.deadline ? <span className="text-muted-foreground">{t("until", { date: shortDate(a.deadline) })}</span> : <span className="text-muted-foreground">{t("noDeadline")}</span>}
                      {a.status !== "archived" && d !== null && d >= 0 && d <= 7 ? <Badge variant="warning">{t("left", { n: d })}</Badge> : null}
                      {a.status !== "archived" && d !== null && d < 0 ? <Badge variant="neutral">{t("expired")}</Badge> : null}
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setEditing(a)}>{t("edit")}</Button>
                      {a.status === "published" ? (
                        <Button type="button" size="sm" variant="ghost" className="min-h-11 md:min-h-8" disabled={archive.isPending} onClick={() => archive.mutate({ id: a.id, archived: true }, { onSuccess: () => setUndo({ id: a.id, title: a.title }) })}>{t("archive")}</Button>
                      ) : (
                        <Button type="button" size="sm" variant="ghost" className="min-h-11 md:min-h-8" disabled={archive.isPending} onClick={() => archive.mutate({ id: a.id, archived: false })}>{t("restore")}</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
      </>
        )}
      </QueryState>
    </PageContainer>
  )
}
