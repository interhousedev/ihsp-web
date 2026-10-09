"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { ExamsOfGroup } from "./exams-of-group"
import { ExamsScope } from "./exams-scope"

/**
 * Exams (midterm and final controls): the teacher sets the date of each of their subjects per group and confirms the
 * dates EMIS and head students suggested. Reached from the sidebar and from the Today card.
 */
export function ExamsPage() {
  const t = useT("exams")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <ExamsScope>{(group) => <ExamsOfGroup key={group.id} group={group} />}</ExamsScope>
    </PageContainer>
  )
}
