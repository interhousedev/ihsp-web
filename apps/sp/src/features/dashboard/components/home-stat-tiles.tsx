"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { useToday } from "../../today/hooks/use-today"

function StatTile({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="bg-card text-card-foreground focus-visible:ring-ring flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-3 text-center shadow-sm outline-none focus-visible:ring-2"
    >
      <span className="text-muted-foreground w-full truncate text-xs">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </Link>
  )
}

/**
 * Attendance (absences of the semester), average mark (GPA out of 5) and rating. The API gives no rating number for
 * the student yet, so the tile shows a dash; every missing value is a dash.
 */
export function HomeStatTiles() {
  const t = useT("home")
  const semester = useToday().data?.semester
  const absences = semester?.absences
  const gpa = semester?.gpa
  return (
    <div data-testid="home-stats" className="grid grid-cols-3 gap-2">
      <StatTile
        href="/timetable/"
        label={t("stats.attendance")}
        value={absences === undefined ? "-" : String(absences)}
      />
      <StatTile
        href="/grades/"
        label={t("stats.average")}
        value={gpa === null || gpa === undefined ? "-" : gpa.toFixed(2)}
      />
      <StatTile href="/grades/" label={t("stats.rating")} value="-" />
    </div>
  )
}
