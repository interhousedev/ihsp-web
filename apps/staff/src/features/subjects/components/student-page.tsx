"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"
import { studentProfileHref } from "../../students/hrefs"

/**
 * `/subjects/student/?id=&group=&subgroup=&student=` moved to the student profile `/students/view/`; this keeps old
 * links working (the subject `id` becomes `subject`, `student` becomes `id`).
 */
export function StudentPage() {
  const ts = useT("subjects")
  const router = useRouter()
  const [subject] = useQueryState("id", parseAsString)
  const [group] = useQueryState("group", parseAsString)
  const [subgroup] = useQueryState("subgroup", parseAsInteger)
  const [student] = useQueryState("student", parseAsString)
  useEffect(() => {
    if (student) router.replace(studentProfileHref(student, { subject, group, subgroup }))
  }, [router, student, subject, group, subgroup])
  return (
    <PageContainer title={ts("title")}>
      <StateView state="loading" rows={2} />
    </PageContainer>
  )
}
