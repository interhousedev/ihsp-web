"use client"

import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, PageContainer } from "@ihsp/ui"
import { ActivitiesTabs } from "@/features/activities/components/activities-tabs"
import { nameOf, useClubAnalytics } from "@/features/activities/clubs-api"

/** Clubs analytics (read-only): management lives on the Clubs tab. */
export function ClubAnalyticsPage() {
  const t = useT("clubAnalytics")
  const a = useT("activities")
  const query = useClubAnalytics()
  return (
    <PageContainer title={t("title")} meta={t("description")}>
      <ActivitiesTabs current="analytics" />
      <QueryState query={query}>
        {(data) => (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: t("kpi.clubs"), value: data.clubs.active },
                { label: t("kpi.events"), value: data.events },
                { label: t("kpi.checkIns"), value: data.check_ins },
                { label: t("kpi.rsvps"), value: data.rsvps },
              ].map((k) => (
                <Card key={k.label} className="min-w-0">
                  <CardContent className="grid gap-1">
                    <p className="text-muted-foreground text-sm">{k.label}</p>
                    <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="min-w-0">
              <CardHeader><CardTitle>{t("table.title")}</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="py-2 pr-3 font-medium">{t("table.club")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("table.members")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("table.events")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("table.attendance")}</th>
                      <th className="py-2 pl-3 text-right font-medium">{t("table.rating")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.per_club ?? []).map((c) => (
                      <tr key={c.club_id} className="border-t">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{nameOf(c.name)}</span>
                          <span className="text-muted-foreground block text-xs">{a(`clubs.status.${c.status}`)}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.members}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.events}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.attendance_rate === null ? "—" : `${Math.round(c.attendance_rate * 100)}%`}</td>
                        <td className="py-2 pl-3 text-right tabular-nums">{c.avg_rating === null ? t("table.noRating") : c.avg_rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data.per_club ?? []).length === 0 ? <p className="text-muted-foreground py-4 text-center text-sm">{a("empty")}</p> : null}
              </CardContent>
            </Card>
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}
