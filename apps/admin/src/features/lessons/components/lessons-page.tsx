"use client"

import { getAdminLessons, keys, type AdminLessonsParams, type LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, PageContainer, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useGroupOptions, useTeacherOptions } from "../../shared/hooks/use-lookups"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col, selectCol } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { audienceLabel, fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { ExtraLessonDialog } from "./extra-lesson-dialog"
import { LessonChangeDialog } from "./lesson-change-dialog"

const FILTER_KEYS = ["from", "to", "group_id", "teacher_id", "status", "teacher_needed"] as const

/** Lessons list with filters, a change dialog per lesson and extra lessons (ADM-10, UF-ADM-07). */
export function LessonsPage() {
  const t = useT("lessons")
  const tSel = useT("shared.selection")
  const f = useFormatters()
  const filters = useFilterState(FILTER_KEYS)
  const groups = useGroupOptions()
  const teachers = useTeacherOptions()
  const [changing, setChanging] = useState<LessonItem | null>(null)
  const [extraOpen, setExtraOpen] = useState(false)

  const params = useMemo<AdminLessonsParams>(
    () => ({
      from: filters.values.from ?? undefined,
      to: filters.values.to ?? undefined,
      group_id: filters.values.group_id ?? undefined,
      teacher_id: filters.values.teacher_id ?? undefined,
      status:
        filters.values.status === "cancelled" || filters.values.status === "scheduled"
          ? filters.values.status
          : undefined,
      teacher_needed: filters.values.teacher_needed === "true" ? true : undefined,
    }),
    [filters.values],
  )
  const source = usePagedList(keys.admin.lessons(params), (cursor, signal) =>
    getAdminLessons({ ...params, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      { kind: "date", key: "from", label: t("filters.from") },
      { kind: "date", key: "to", label: t("filters.to") },
      {
        kind: "select",
        key: "group_id",
        label: t("filters.group"),
        allLabel: t("filters.allGroups"),
        options: (groups.data ?? []).map((group) => ({ value: group.id, label: group.name })),
      },
      {
        kind: "select",
        key: "teacher_id",
        label: t("filters.teacher"),
        allLabel: t("filters.allTeachers"),
        options: (teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) })),
      },
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: [
          { value: "scheduled", label: t("status.scheduled") },
          { value: "cancelled", label: t("status.cancelled") },
        ],
      },
      {
        kind: "select",
        key: "teacher_needed",
        label: t("filters.teacherNeeded"),
        allLabel: t("filters.anyTeacher"),
        options: [{ value: "true", label: t("filters.onlyTeacherNeeded") }],
      },
    ],
    [groups.data, teachers.data, t],
  )

  const columns = useMemo(
    () => [
      selectCol<LessonItem>({
        all: tSel("selectAll"),
        row: (lesson) => tSel("selectRow", { name: `${lesson.subject.name}, ${f.date(lesson.date)}` }),
      }),
      col<LessonItem>(
        "date",
        t("columns.date"),
        (lesson) => (
          <span className="font-medium">
            {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })}
          </span>
        ),
        { sort: (lesson) => `${lesson.date} ${lesson.starts_at}` },
      ),
      col<LessonItem>(
        "time",
        t("columns.time"),
        (lesson) => `${lesson.period}. ${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
        { sort: (lesson) => lesson.period },
      ),
      col<LessonItem>(
        "subject",
        t("columns.subject"),
        (lesson) => (
          <Link
            href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
            className="underline-offset-4 hover:underline"
          >
            {lesson.subject.name}
          </Link>
        ),
        { sort: (lesson) => lesson.subject.name },
      ),
      col<LessonItem>(
        "teacher",
        t("columns.teacher"),
        (lesson) =>
          lesson.teacher ? fullName(lesson.teacher) : <Badge variant="destructive">{t("teacherNeeded")}</Badge>,
        { sort: (lesson) => (lesson.teacher ? fullName(lesson.teacher) : null) },
      ),
      col<LessonItem>("room", t("columns.room"), (lesson) => lesson.room?.name ?? "—", {
        sort: (lesson) => lesson.room?.name,
      }),
      col<LessonItem>("audience", t("columns.audience"), (lesson) => audienceLabel(lesson.audience), {
        sort: (lesson) => audienceLabel(lesson.audience),
      }),
      col<LessonItem>(
        "status",
        t("columns.status"),
        (lesson) => (
          <span className="flex flex-wrap gap-1">
            <Badge variant={lesson.status === "cancelled" ? "destructive" : "secondary"}>
              {t(`status.${lesson.status}`)}
            </Badge>
            {lesson.is_overridden ? <Badge variant="outline">{t("changed")}</Badge> : null}
          </span>
        ),
        { sort: (lesson) => lesson.status },
      ),
      actionsCol<LessonItem>(t("columns.actions"), (lesson) => (
        <>
          <Link
            href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
            className={buttonVariants({ variant: "outline", className: TOUCH })}
            aria-label={t("openLesson", { subject: lesson.subject.name, date: f.date(lesson.date) })}
          >
            {t("openAction")}
          </Link>
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            aria-label={t("changeLesson", { subject: lesson.subject.name, date: f.date(lesson.date) })}
            onClick={() => setChanging(lesson)}
          >
            {t("changeAction")}
          </Button>
        </>
      )),
    ],
    [f, t, tSel],
  )

  function lessonsCsv(rows: LessonItem[]) {
    downloadCsv("lessons.csv", [
      [
        t("columns.date"),
        t("columns.time"),
        t("columns.subject"),
        t("columns.teacher"),
        t("columns.room"),
        t("columns.audience"),
        t("columns.status"),
      ],
      ...rows.map((lesson) => [
        lesson.date,
        `${lesson.period}`,
        lesson.subject.name,
        lesson.teacher ? fullName(lesson.teacher) : "",
        lesson.room?.name,
        audienceLabel(lesson.audience),
        lesson.status,
      ]),
    ])
  }

  async function exportCsv() {
    lessonsCsv(await fetchAllPages((cursor) => getAdminLessons({ ...params, cursor, limit: SERVER_PAGE_SIZE })))
  }

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setExtraOpen(true)}>
          <Icons.add aria-hidden />
          {t("extraAction")}
        </Button>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(lesson) => lesson.id}
        emptyText={t("empty")}
        renderSelectionActions={(selected) => (
          <ExportButton label={tSel("exportSelected")} onExport={async () => lessonsCsv(selected)} />
        )}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          >
            <ExportButton onExport={exportCsv} />
          </ListToolbar>
        }
      />
      {changing ? <LessonChangeDialog lesson={changing} onClose={() => setChanging(null)} /> : null}
      <ExtraLessonDialog open={extraOpen} onOpenChange={setExtraOpen} />
    </PageContainer>
  )
}
