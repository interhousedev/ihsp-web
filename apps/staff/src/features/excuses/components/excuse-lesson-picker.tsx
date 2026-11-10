"use client"

import { getStaffGroupAttendanceQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Checkbox } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

/** The lessons of the group in the period (`view=lesson`); each row key is a lesson id. */
export function ExcuseLessonPicker({
  groupId,
  from,
  to,
  selected,
  onChange,
}: {
  groupId: string
  from: string
  to: string
  selected: readonly string[]
  onChange: (ids: string[]) => void
}) {
  const t = useT("excuses.form")
  const query = useQuery(getStaffGroupAttendanceQuery(groupId, { view: "lesson", from, to }))
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{t("lessons")}</legend>
      <QueryState query={query} rows={3} isEmpty={(report) => report.rows.length === 0} emptyText={t("lessonsEmpty")}>
        {(report) => (
          <ul className="flex max-h-48 flex-col overflow-y-auto rounded-lg border">
            {report.rows.map((row) => (
              <li key={row.key}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm md:min-h-8">
                  <Checkbox
                    checked={selected.includes(row.key)}
                    onCheckedChange={(checked) =>
                      onChange(checked ? [...selected, row.key] : selected.filter((id) => id !== row.key))
                    }
                  />
                  {row.label}
                </label>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </fieldset>
  )
}
