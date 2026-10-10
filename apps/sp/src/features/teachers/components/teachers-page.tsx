"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { QueryState } from "../../shared/components/query-state"
import { useMyTeachers } from "../hooks/use-my-teachers"
import { TeacherCard } from "./teacher-card"

/** `/teachers/`: the teachers of the student's groups with contacts and where they are now. */
export function TeachersPage() {
  const t = useT("teachers.page")
  const teachers = useMyTeachers()
  return (
    <PageContainer title={t("title")}>
      <QueryState query={teachers} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
        {(items) => (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((teacher) => (
              <li key={teacher.id}>
                <TeacherCard teacher={teacher} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageContainer>
  )
}
