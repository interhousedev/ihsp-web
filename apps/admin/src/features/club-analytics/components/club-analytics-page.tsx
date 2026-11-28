"use client"

import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
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
              <CardHeader>
                <CardTitle>{t("table.title")}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.club")}</TableHead>
                      <TableHead className="text-end">{t("table.members")}</TableHead>
                      <TableHead className="text-end">{t("table.events")}</TableHead>
                      <TableHead className="text-end">{t("table.attendance")}</TableHead>
                      <TableHead className="text-end">{t("table.rating")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.per_club ?? []).map((c) => (
                      <TableRow key={c.club_id}>
                        <TableCell>
                          <span className="font-medium">{nameOf(c.name)}</span>
                          <span className="text-muted-foreground block text-xs">{a(`clubs.status.${c.status}`)}</span>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{c.members}</TableCell>
                        <TableCell className="text-end tabular-nums">{c.events}</TableCell>
                        <TableCell className="text-end tabular-nums">
                          {c.attendance_rate === null ? "—" : `${Math.round(c.attendance_rate * 100)}%`}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">
                          {c.avg_rating === null ? t("table.noRating") : c.avg_rating.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(data.per_club ?? []).length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">{a("empty")}</p>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}
