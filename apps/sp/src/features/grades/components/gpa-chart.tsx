"use client"

import type { RecordBook } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@ihsp/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

/**
 * The GPA line of the record book. Its own module because Recharts is large (about 430 KB with `date-fns` and
 * `decimal.js`): `record-book-tab.tsx` loads it lazily, so the grades page does not pay for the chart up front.
 */
export default function GpaChart({ book }: { book: RecordBook }) {
  const t = useT("grades.record")
  const config = { gpa: { label: t("gpa"), color: "var(--chart-1)" } } satisfies ChartConfig
  const data = book.semesters.map((semester) => ({
    semester: t("semesterShort", { number: semester.semester }),
    gpa: semester.gpa,
  }))
  return (
    <ChartContainer config={config} className="h-56 w-full" role="img" aria-label={t("chartLabel")}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="semester" tickLine={false} axisLine={false} />
        <YAxis domain={[2, 5]} tickCount={4} width={28} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="gpa" type="monotone" stroke="var(--color-gpa)" strokeWidth={2} dot connectNulls />
      </LineChart>
    </ChartContainer>
  )
}
