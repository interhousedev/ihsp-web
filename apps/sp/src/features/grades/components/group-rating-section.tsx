"use client"

import { isApiError, type GroupRatingRow } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ScrollList, useIsMobile } from "@ihsp/ui"
import { useSemesterGrades } from "../hooks/use-grades"
import { useGroupRating } from "../hooks/use-group-rating"

function formatGpa(value: number | null | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : "—"
}

/**
 * The group's students by GPA with their EMIS rating. Only the head student can see the group: any other student gets
 * their own GPA instead of the table. Nothing is invented; an empty group says so. Any other failure shows nothing.
 */
export function GroupRatingSection({ semester }: { semester: number | undefined }) {
  const t = useT("grades.rating")
  const isMobile = useIsMobile()
  const rating = useGroupRating(semester)
  const own = useSemesterGrades(semester)

  if (rating.isPending) return null

  if (rating.isError) {
    const notHead = isApiError(rating.error) && rating.error.status === 403
    if (!notHead) return null
    return (
      <section aria-labelledby="own-gpa-title" className="flex flex-col gap-2">
        <h2 id="own-gpa-title" className="text-base font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm">
          {t("ownGpa")}: <span className="font-semibold">{formatGpa(own.data?.gpa)}</span>
        </p>
      </section>
    )
  }

  const rows = rating.data ?? []
  return (
    <section aria-labelledby="group-rating-title" className="flex flex-col gap-2">
      <h2 id="group-rating-title" className="text-base font-semibold">
        {t("title")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : isMobile ? (
        <ScrollList label={t("list")}>
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <RatingCard key={row.name} row={row} />
            ))}
          </ul>
        </ScrollList>
      ) : (
        <ScrollList label={t("list")}>
          <RatingTable rows={rows} />
        </ScrollList>
      )}
    </section>
  )
}

function RatingTable({ rows }: { rows: GroupRatingRow[] }) {
  const t = useT("grades.rating")
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground text-left">
          <th scope="col" className="py-2 pr-2">
            {t("rank")}
          </th>
          <th scope="col" className="py-2 pr-2">
            {t("name")}
          </th>
          <th scope="col" className="py-2 pr-2 text-right">
            {t("gpa")}
          </th>
          <th scope="col" className="py-2 text-right">
            {t("emis")}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.name}
            aria-current={row.is_me ? "true" : undefined}
            className={row.is_me ? "bg-muted font-semibold" : undefined}
          >
            <td className="py-2 pr-2">{row.rank ?? "—"}</td>
            <td className="py-2 pr-2">{row.name}</td>
            <td className="py-2 pr-2 text-right">{formatGpa(row.gpa)}</td>
            <td className="py-2 text-right">{row.emis_rating ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RatingCard({ row }: { row: GroupRatingRow }) {
  const t = useT("grades.rating")
  return (
    <li
      aria-current={row.is_me ? "true" : undefined}
      className={`flex flex-col gap-1 rounded-card border p-3 text-sm ${row.is_me ? "bg-muted font-semibold" : ""}`}
    >
      <span className="font-medium">{row.name}</span>
      <span className="text-muted-foreground">
        {t("rank")} {row.rank ?? "—"} · {t("gpa")}: {formatGpa(row.gpa)} · {t("emis")}: {row.emis_rating ?? "—"}
      </span>
    </li>
  )
}
