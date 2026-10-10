"use client"

import { getAdminGroupsQuery, getAdminGroupsStatsQuery, getAdminInsightsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@ihsp/ui"
import { useQueries, useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { QueryState } from "../../shared/components/query-state"
import { percent } from "../utils"

const MARK_COLORS: Record<string, string> = {
  // Fixed mid-tone hues: the theme's chart colours can be near-white (or near-black) and vanish on the card.
  "2": "oklch(0.64 0.21 25)",
  "3": "oklch(0.76 0.16 70)",
  "4": "oklch(0.62 0.17 255)",
  "5": "oklch(0.66 0.17 150)",
}

function AttendanceChart() {
  const t = useT("reports.academic")
  const [stats, groups] = useQueries({
    queries: [getAdminGroupsStatsQuery(), getAdminGroupsQuery({ status: "active" })],
  })
  const config = { rate: { label: t("attendanceRate"), color: "var(--chart-1)" } } satisfies ChartConfig
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("attendanceTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          query={stats}
          isEmpty={(rows) => rows.every((row) => row.attendance_rate === null)}
          emptyText={t("noAttendance")}
          rows={3}
        >
          {(rows) => {
            const names = new Map((groups.data ?? []).map((group) => [group.id, group.name]))
            const data = rows
              .filter((row) => row.attendance_rate !== null)
              .map((row) => ({ group: names.get(row.group_id) ?? "—", rate: percent(row.attendance_rate) }))
              .toSorted((a, b) => (a.rate ?? 0) - (b.rate ?? 0))
            return (
              <ChartContainer
                config={config}
                className="w-full"
                style={{ height: Math.max(160, data.length * 32 + 32) }}
                role="img"
                aria-label={t("attendanceTitle")}
              >
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value: number) => `${value}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis type="category" dataKey="group" width={72} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={3} />
                </BarChart>
              </ChartContainer>
            )
          }}
        </QueryState>
      </CardContent>
    </Card>
  )
}

function MarksChart() {
  const t = useT("reports.academic")
  const query = useQuery(getAdminInsightsQuery())
  const config = { count: { label: t("marksCount"), color: "var(--chart-1)" } } satisfies ChartConfig
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("marksTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          query={query}
          isEmpty={({ marks }) => Object.values(marks.distribution).every((count) => count === 0)}
          emptyText={t("noMarks")}
          rows={3}
        >
          {({ marks }) => {
            const data = Object.entries(marks.distribution).map(([mark, count]) => ({ mark, count }))
            return (
              <ChartContainer config={config} className="h-56 w-full" role="img" aria-label={t("marksTitle")}>
                <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mark" tickLine={false} axisLine={false} />
                  <YAxis width={40} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={3}>
                    {data.map((entry) => (
                      <Cell key={entry.mark} fill={MARK_COLORS[entry.mark]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )
          }}
        </QueryState>
      </CardContent>
    </Card>
  )
}

/** Attendance rate per group (this term) and how the marks are distributed. */
export function AcademicTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AttendanceChart />
      <MarksChart />
    </div>
  )
}
