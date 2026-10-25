"use client"

import { getStaffSubjectsQuery, getTeachingGroupQuery, type TeachingGroup, type TeachingLesson } from "@ihsp/api"
import { formatDate, formatTime, todayIso, useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { lessonHref } from "../../shared/utils/lesson-time"
import { subjectHref, subjectStudentHref } from "../utils/hrefs"
import { splitLessons } from "../utils/timetable"
import { GroupNotebook } from "./subject-groups"

/** The page title: the group, and the subgroup when one is open. */
export function useGroupTitle(): (group: Pick<TeachingGroup, "group_name" | "subgroup">) => string {
  const t = useT("subjects.group")
  return (group) =>
    group.subgroup === null ? group.group_name : t("subgroupTitle", { group: group.group_name, number: group.subgroup })
}

function Students({ group }: { group: TeachingGroup }) {
  const t = useT("subjects.group")
  return (
    <section aria-labelledby="group-students" className="flex flex-col gap-3">
      <h2 id="group-students" className="text-lg font-semibold">
        {t("students", { count: group.students.length })}
      </h2>
      {group.students.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noStudents")}</p>
      ) : (
        <ul className="bg-card ring-foreground/10 divide-border flex flex-col divide-y rounded-xl ring-1">
          {group.students.map((student) => (
            <li key={student.user_id}>
              <Link
                href={subjectStudentHref(group.subject_id, group.group_id, group.subgroup, student.user_id)}
                className="hover:bg-muted flex min-h-11 items-center justify-between gap-3 px-4 py-2"
              >
                <span>
                  {student.last_name} {student.first_name}
                </span>
                {group.subgroup === null && student.subgroup !== null ? (
                  <span className="text-muted-foreground text-xs">
                    {t("subgroupBadge", { number: student.subgroup })}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Lessons({ title, lessons }: { title: string; lessons: TeachingLesson[] }) {
  const t = useT("subjects.group")
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {lessons.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noLessons")}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {lessons.map((lesson) => (
            <li key={lesson.id} className={lesson.status === "cancelled" ? "line-through opacity-70" : undefined}>
              <a
                href={lessonHref(lesson.id)}
                className="flex min-h-11 flex-wrap items-center gap-x-2 hover:underline md:min-h-0"
              >
                <span className="font-medium">
                  {formatDate(lesson.date)} · {formatTime(lesson.starts_at)}
                </span>
                <span className="text-muted-foreground">
                  {t("period", { number: lesson.period })}
                  {lesson.room_name ? ` · ${t("room", { room: lesson.room_name })}` : ""}
                  {lesson.topic ? ` · ${lesson.topic}` : ""}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Timetable({ group }: { group: TeachingGroup }) {
  const t = useT("subjects.group")
  const { thisWeek, upcoming } = splitLessons(group.lessons, todayIso())
  return (
    <section aria-labelledby="group-timetable" className="flex flex-col gap-3">
      <h2 id="group-timetable" className="text-lg font-semibold">
        {t("timetable")}
      </h2>
      <Lessons title={t("thisWeek")} lessons={thisWeek} />
      <Lessons title={t("upcoming")} lessons={upcoming} />
    </section>
  )
}

/** `/subjects/group/?id=&group=&subgroup=`: the students of a taught group (or subgroup), its notebook and lessons. */
export function GroupPage() {
  const ts = useT("subjects")
  const title = useGroupTitle()
  const [id] = useQueryState("id", parseAsString)
  const [groupId] = useQueryState("group", parseAsString)
  const [subgroup] = useQueryState("subgroup", parseAsInteger)
  const subjects = useQuery(getStaffSubjectsQuery())
  const query = useQuery({ ...getTeachingGroupQuery(id ?? "", groupId ?? "", subgroup), enabled: !!id && !!groupId })
  if (!id || !groupId) {
    return (
      <PageContainer title={ts("title")}>
        <StateView state="empty" emptyText={ts("noId")} />
      </PageContainer>
    )
  }
  const subject = subjects.data?.find((item) => item.subject_id === id)
  return (
    <QueryState query={query} rows={4}>
      {(group) => (
        <PageContainer title={title(group)} description={group.subject_name}>
          <BackLink href={subjectHref(id)} label={ts("group.back", { subject: group.subject_name })} />
          <div className="flex flex-col gap-8">
            {subject ? (
              <div className="flex flex-wrap gap-2">
                <GroupNotebook subject={subject} groupId={group.group_id} />
              </div>
            ) : null}
            <Students group={group} />
            <Timetable group={group} />
          </div>
        </PageContainer>
      )}
    </QueryState>
  )
}
