"use client"

import { getStaffLessonSourcesQuery, type StaffSubject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { byGroup } from "../utils/groups"
import { EmisHiddenSwitch } from "./emis-hidden-switch"
import { LessonSourceRow } from "./lesson-source-row"

const PAGE_SIZE = 20
const ALL_GROUPS = "all"

/** "From lessons (EMIS)": the materials of the teacher's lessons by group, with hide and show, and the group rule. */
export function SubjectLessonSources({ subject }: { subject: StaffSubject }) {
  const t = useT("subjects.lessonSources")
  const groups = byGroup(subject.groups)
  const [group, setGroup] = useState(ALL_GROUPS)
  const [offset, setOffset] = useState(0)
  const query = useQuery(
    getStaffLessonSourcesQuery(subject.subject_id, {
      group_id: group === ALL_GROUPS ? undefined : group,
      limit: PAGE_SIZE,
      offset,
    }),
  )
  const total = query.data?.total ?? 0
  const last = Math.min(offset + PAGE_SIZE, total)

  return (
    <section aria-labelledby="subject-lesson-sources" className="flex flex-col gap-3">
      <h2 id="subject-lesson-sources" className="text-lg font-semibold">
        {t("heading")}
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-sources-group" className="text-sm font-medium">
          {t("group")}
        </label>
        <Dropdown
          id="lesson-sources-group"
          className="w-full sm:w-60"
          value={group}
          onValueChange={(value) => {
            setGroup(value)
            setOffset(0)
          }}
          options={[
            { value: ALL_GROUPS, label: t("allGroups") },
            ...groups.map((item) => ({ value: item.group_id, label: item.group_name })),
          ]}
        />
      </div>
      <div className="flex flex-col">
        {groups.map((item) => (
          <EmisHiddenSwitch
            key={item.group_id}
            subjectId={subject.subject_id}
            groupId={item.group_id}
            groupName={item.group_name}
          />
        ))}
      </div>
      <QueryState query={query} rows={3}>
        {(page) =>
          page.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ol aria-label={t("heading")} className="flex flex-col gap-2">
              {page.items.map((item) => (
                <LessonSourceRow key={item.link_id} item={item} subjectId={subject.subject_id} />
              ))}
            </ol>
          )
        }
      </QueryState>
      {total > PAGE_SIZE ? (
        <nav aria-label={t("pages")} className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <Icons.chevronLeft aria-hidden />
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">{t("range", { from: offset + 1, to: last, total })}</span>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={last >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            {t("next")}
            <Icons.chevronRight aria-hidden />
          </Button>
        </nav>
      ) : null}
    </section>
  )
}
