"use client"

import { getStaffSubjectsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { SUBJECTS_HREF } from "../utils/hrefs"
import { SubjectGroups } from "./subject-groups"
import { SubjectMaterials } from "./subject-materials"

/** `/subjects/view/?id=`: one subject the teacher teaches: its groups (notebook, lessons) and its materials. */
export function SubjectPage() {
  const t = useT("subjects")
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery(getStaffSubjectsQuery())
  if (id === null || id === "") {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("noId")} />
      </PageContainer>
    )
  }
  return (
    <QueryState query={query} rows={3}>
      {(subjects) => {
        const subject = subjects.find((item) => item.subject_id === id)
        if (!subject) {
          return (
            <PageContainer title={t("title")}>
              <BackLink href={SUBJECTS_HREF} label={t("back")} />
              <StateView state="empty" emptyText={t("notTaught")} />
            </PageContainer>
          )
        }
        return (
          <PageContainer title={subject.name}>
            <BackLink href={SUBJECTS_HREF} label={t("back")} />
            <div className="flex flex-col gap-8">
              <SubjectGroups subject={subject} />
              <SubjectMaterials subjectId={subject.subject_id} />
            </div>
          </PageContainer>
        )
      }}
    </QueryState>
  )
}
