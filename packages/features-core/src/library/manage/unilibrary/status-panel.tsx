"use client"

import { getUniLibraryStatusQuery, type UniLibraryStatus } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Skeleton,
  StateView,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

const BREAKER_VARIANT = { closed: "default", open: "destructive", half_open: "secondary" } as const

function CallsTable({ calls }: { calls: UniLibraryStatus["last_calls"] }) {
  const t = useT("library.manage.unilibrary.status")
  const format = useFormatters()
  if (calls.length === 0) return <p className="text-muted-foreground text-sm">{t("noCalls")}</p>
  return (
    <Table>
      <TableCaption className="sr-only">{t("calls")}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{t("time")}</TableHead>
          <TableHead scope="col">{t("result")}</TableHead>
          <TableHead scope="col">{t("duration")}</TableHead>
          <TableHead scope="col">{t("path")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <TableRow key={`${call.at}-${call.path}`}>
            <TableCell>{format.dateTime(call.at)}</TableCell>
            <TableCell>
              <Badge variant={call.ok ? "secondary" : "destructive"}>{call.ok ? t("ok") : t("failed")}</Badge>
            </TableCell>
            <TableCell className="tabular-nums">{t("ms", { ms: call.ms })}</TableCell>
            <TableCell className="font-mono text-xs break-all whitespace-normal">{call.path}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * What the server knows about UniLibrary: the circuit breaker, the last calls, the cache and the records a librarian
 * hid. It works while UniLibrary is off too (the admin routes always answer), so an administrator can see the state
 * before switching it on.
 */
export function StatusPanel() {
  const t = useT("library.manage.unilibrary.status")
  const format = useFormatters()
  const status = useQuery(getUniLibraryStatusQuery())

  return (
    <section aria-labelledby="unilibrary-status" className="flex flex-col gap-4 rounded-xl border p-4">
      <h2 id="unilibrary-status" className="text-lg font-semibold">
        {t("title")}
      </h2>
      {status.isPending ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : status.isError ? (
        <StateView state="error" error={status.error} onRetry={() => void status.refetch()} />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {t("breaker")}
              <Badge variant={BREAKER_VARIANT[status.data.breaker]}>{t(`breakerState.${status.data.breaker}`)}</Badge>
            </p>
            <p className="text-muted-foreground text-xs">{t(`breakerHint.${status.data.breaker}`)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {(
              [
                ["hits", status.data.cache.hits],
                ["misses", status.data.cache.misses],
                ["stale", status.data.cache.stale_served],
              ] as const
            ).map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted-foreground text-xs">{t(`cache.${key}`)}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {format.locale ? value.toLocaleString(format.locale) : value}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-muted-foreground text-xs">{t("cache.rate")}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {status.data.cache.hits + status.data.cache.misses === 0
                  ? "–"
                  : new Intl.NumberFormat(format.locale, { style: "percent", maximumFractionDigits: 0 }).format(
                      status.data.cache.hits / (status.data.cache.hits + status.data.cache.misses),
                    )}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("calls")}</h3>
            <CallsTable calls={status.data.last_calls} />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("hidden")}</h3>
            {status.data.hidden_records.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noHidden")}</p>
            ) : (
              <ul aria-label={t("hidden")} className="flex flex-col divide-y text-sm">
                {status.data.hidden_records.map((record) => (
                  <li key={record.external?.external_id ?? record.title} className="flex flex-col gap-0.5 py-2">
                    <span className="font-medium break-words">{record.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {[record.author_label, record.external?.external_id].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
