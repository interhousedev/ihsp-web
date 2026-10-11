"use client"

import type { UsageResponse, UsageRow, UsageTopUser } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, Stat } from "@ihsp/ui"
import { compact, tokens, usd } from "../utils"

/** The four numbers of today and the month, as cards. */
export function UsageSummary({ usage }: { usage: UsageResponse }) {
  const t = useT("limits")
  const f = useFormatters()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label={t("cards.monthCost")}
        value={usd(usage.month.cost_usd, f.locale)}
        hint={`${t("cards.projected")}: ${usd(usage.month.projected_usd, f.locale)}`}
      />
      <Stat
        label={t("cards.tokensToday")}
        value={compact(tokens(usage.today), f.locale)}
        hint={usage.today.failed > 0 ? t("cards.failed", { count: usage.today.failed }) : undefined}
      />
      <Stat label={t("cards.callsToday")} value={compact(usage.today.calls, f.locale)} />
      <Stat label={t("cards.rangeCost")} value={usd(usage.totals.cost_usd, f.locale)} />
    </div>
  )
}

/** Cost per key (a model or a role) as bars, largest first. */
export function DistributionCard({
  title,
  rows,
  label,
}: {
  title: string
  rows: UsageRow[]
  label: (key: string) => string
}) {
  const t = useT("limits")
  const f = useFormatters()
  const sorted = rows.toSorted((a, b) => b.cost_usd - a.cost_usd)
  const largest = sorted[0]?.cost_usd ?? 0
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {largest > 0 ? (
          <ul className="flex flex-col gap-3">
            {sorted
              .filter((row) => row.calls > 0)
              .map((row) => (
                <li key={row.key} className="flex flex-col gap-1">
                  <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                    <span className="min-w-0 break-all">{label(row.key)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {usd(row.cost_usd, f.locale)} · {compact(row.calls, f.locale)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(row.cost_usd / largest) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-muted-foreground py-6 text-center text-sm">{t("charts.empty")}</p>
        )}
      </CardContent>
    </Card>
  )
}

/** The users with the largest cost of the range. */
export function TopUsersCard({ users }: { users: UsageTopUser[] }) {
  const t = useT("limits")
  const f = useFormatters()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("top.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t("top.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="text-muted-foreground text-start text-xs">
                  <th className="py-2 pe-3 text-start font-medium">{t("top.user")}</th>
                  <th className="py-2 pe-3 text-start font-medium">{t("top.role")}</th>
                  <th className="py-2 pe-3 text-end font-medium">{t("top.calls")}</th>
                  <th className="py-2 pe-3 text-end font-medium">{t("top.tokens")}</th>
                  <th className="py-2 text-end font-medium">{t("top.cost")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-t">
                    <td className="py-2 pe-3">
                      <div className="font-medium">{user.name}</div>
                      {user.login ? <div className="text-muted-foreground text-xs">{user.login}</div> : null}
                    </td>
                    <td className="py-2 pe-3">{t.has(`roles.${user.role}`) ? t(`roles.${user.role}`) : user.role}</td>
                    <td className="py-2 pe-3 text-end tabular-nums">{compact(user.calls, f.locale)}</td>
                    <td className="py-2 pe-3 text-end tabular-nums">{compact(tokens(user), f.locale)}</td>
                    <td className="py-2 text-end tabular-nums">{usd(user.cost_usd, f.locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
