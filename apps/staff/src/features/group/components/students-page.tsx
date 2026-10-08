"use client"

import { getStaffGroupQuery, getStaffGroupStudentsQuery, type CuratorStudent, type GroupItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { fullName } from "../../shared/utils/people"
import { sortStudents } from "../utils/students"
import { GroupScope } from "./group-scope"
import { StudentDrawer } from "./student-drawer"
import { StudentRow } from "./student-row"

function StudentsOfGroup({ group }: { group: GroupItem }) {
  const t = useT("group.students")
  const students = useQuery(getStaffGroupStudentsQuery(group.id))
  const detail = useQuery(getStaffGroupQuery(group.id))
  const [open, setOpen] = useState<CuratorStudent | null>(null)
  const headStudent = detail.data?.head_student ?? group.head_student

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-lg font-semibold">{group.name}</span>
        <span className="text-muted-foreground">
          {headStudent ? t("headStudent", { name: fullName(headStudent) }) : t("noHeadStudent")}
        </span>
        <span className="text-muted-foreground">{t("count", { count: group.students_count })}</span>
      </div>
      <QueryState
        query={students}
        rows={4}
        isEmpty={(items) => sortStudents(items).length === 0}
        emptyText={t("empty")}
      >
        {(items) => {
          const sorted = sortStudents(items)
          const flagged = sorted.filter((student) => student.flags.length > 0).length
          return (
            <>
              <p className="text-muted-foreground text-sm" role="status">
                {flagged > 0 ? t("flaggedCount", { count: flagged }) : t("noneFlagged")}
              </p>
              <div className="text-muted-foreground hidden grid-cols-[minmax(0,2fr)_6rem_6rem_6rem_minmax(0,2fr)] gap-3 px-3 text-xs font-medium md:grid">
                <span>{t("student")}</span>
                <span>{t("subgroup")}</span>
                <span>{t("absenceRate")}</span>
                <span>{t("gpa")}</span>
                <span>{t("attention")}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {sorted.map((student) => (
                  <StudentRow key={student.user_id} student={student} onOpen={() => setOpen(student)} />
                ))}
              </ul>
            </>
          )
        }}
      </QueryState>
      <StudentDrawer student={open} onClose={() => setOpen(null)} />
    </>
  )
}

/** My group → Students (STF-11, STF-14, STF-15, UF-STF-09): the curator's group with who needs attention first. */
export function StudentsPage() {
  const t = useT("group.students")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <GroupScope>{(group) => <StudentsOfGroup group={group} />}</GroupScope>
    </PageContainer>
  )
}
