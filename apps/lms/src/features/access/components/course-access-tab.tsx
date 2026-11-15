"use client"

import { useT } from "@ihsp/i18n"
import { QueryState } from "@ihsp/features-core"
import { useAccessRules, useCanManageAccess, useSaveAccess } from "../hooks/use-access-rules"
import { AccessRuleForm } from "./access-rule-form"

/** The Access section of the course settings: who may open the course at all. */
export function CourseAccessTab({ courseId, permissions }: { courseId: string; permissions: readonly string[] }) {
  const t = useT("access")
  const rules = useAccessRules(courseId)
  const save = useSaveAccess(courseId, null)
  const canManage = useCanManageAccess(permissions)
  return (
    <section aria-labelledby="access-course" className="flex flex-col gap-3">
      <h3 id="access-course" className="text-base font-semibold">
        {t("courseTitle")}
      </h3>
      <QueryState query={rules} rows={3}>
        {(data) => (
          <AccessRuleForm
            key={JSON.stringify(data.course)}
            courseId={courseId}
            rule={data.course}
            readOnly={!canManage}
            pending={save.isPending}
            error={save.error}
            idPrefix="course-access"
            onSave={(body) => save.mutate(body)}
          />
        )}
      </QueryState>
    </section>
  )
}
