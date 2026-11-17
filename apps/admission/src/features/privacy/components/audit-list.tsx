"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { auditQuery } from "../../consent/api"

/** Who looked at the student's data: actor kind, action and time, newest first as the API returns them. */
export function AuditList() {
  const t = useT("privacy")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const audit = useQuery(auditQuery())
  const label = (group: string, value: string) => {
    const key = value.replaceAll(".", "_")
    if (t.has(`audit.${group}.${key}`)) return t(`audit.${group}.${key}`)
    const text = value.replace(/[._]/g, " ")
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return (
    <section className="grid gap-2" aria-labelledby="audit-title">
      <h2 id="audit-title" className="text-base font-semibold">
        {t("audit.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("audit.intro")}</p>
      {audit.isPending ? <Skeleton className="h-24 w-full" /> : null}
      {audit.isError ? <Alert variant="destructive">{errorMessage(audit.error)}</Alert> : null}
      {audit.data && audit.data.items.length === 0 ? <p className="text-sm">{t("audit.empty")}</p> : null}
      {audit.data && audit.data.items.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {audit.data.items.map((record, index) => (
            <li key={`${record.at}-${index}`} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
              <span>
                {label("actors", record.actor_kind)} · {label("actions", record.action)}
                {record.object_type ? ` · ${label("objectTypes", record.object_type)}` : ""}
              </span>
              <time className="text-muted-foreground" dateTime={record.at}>
                {format.dateTime(record.at)}
              </time>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
