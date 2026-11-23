"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Input, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useDeferredValue, useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { FIELDS, pick, useTrajectories } from "../api"

const SELECT = "border-input bg-background h-11 rounded-md border px-3 text-sm"

export function TrajectoriesBody() {
  const t = useT("trajectories")
  const lang = useLocale()
  const [q, setQ] = useState("")
  const [field, setField] = useState("")
  const query = useTrajectories(useDeferredValue(q.trim()), field)
  const rows = query.data?.items ?? []

  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (rows.length === 0) body = <StateView state="empty" title={t("emptyTitle")} description={t("emptyText")} />
  else
    body = (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const pct = r.required_count ? Math.round((r.done_count / r.required_count) * 100) : 0
          return (
            <li key={r.id}>
              <Link
                href={`/trajectories/view/?slug=${encodeURIComponent(r.slug)}`}
                className="bg-card hover:border-primary flex h-full flex-col gap-2 rounded-card border p-4 transition"
              >
                <span className="text-muted-foreground text-xs">{t(`field.${r.field}`)}</span>
                <span className="text-lg font-semibold">{pick(r.title, lang)}</span>
                <span className="text-muted-foreground line-clamp-3 text-sm">{pick(r.description, lang)}</span>
                <span className="text-muted-foreground mt-auto text-xs">
                  {t("counts", { stages: r.stage_count, steps: r.node_count })}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span
                    className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
                    role="img"
                    aria-label={t("progressLabel", { done: r.done_count, total: r.required_count })}
                  >
                    <span className="bg-success block h-full" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="tabular-nums">
                    {r.done_count}/{r.required_count}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader icon="route" title={t("title")} />
      <div className="flex flex-wrap gap-2">
        <Input
          type="search"
          className="h-11 min-w-0 flex-1 sm:max-w-sm"
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label={t("fieldLabel")}
          className={SELECT}
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          <option value="">{t("allFields")}</option>
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {t(`field.${f}`)}
            </option>
          ))}
        </select>
      </div>
      {body}
    </div>
  )
}

export function TrajectoriesPage() {
  return (
    <AdmissionShell>
      <TrajectoriesBody />
    </AdmissionShell>
  )
}
