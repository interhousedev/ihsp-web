"use client"

import { getAdminTeacherContacts, keys, putAdminTeacherContacts } from "@ihsp/api"
import { TeacherContactsForm } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"

/** The teacher's public contacts (shown to their students), edited by an administrator. */
export function TeacherContactsSection({ teacherId }: { teacherId: string }) {
  const t = useT("teachers.profile")
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{t("contacts")}</h2>
      <TeacherContactsForm
        queryKey={keys.admin.teacherContacts(teacherId)}
        load={(signal) => getAdminTeacherContacts(teacherId, { signal })}
        save={(body) => putAdminTeacherContacts(teacherId, body)}
      />
    </section>
  )
}
