"use client"

import { keys, patchAdminGroup, type GroupDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useTeacherOptions } from "../../shared/hooks/use-lookups"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"

/** Curator (a teacher), head student (one of the group's students) and archive state of a group (UF-ADM-04 step 3). */
export function GroupPeopleCard({ group }: { group: GroupDetail }) {
  const t = useT("groups.view")
  const teachers = useTeacherOptions()
  const [curatorId, setCuratorId] = useState(group.curator?.id ?? "")
  const [headId, setHeadId] = useState(group.head_student?.id ?? "")
  const [status, setStatus] = useState<GroupDetail["status"]>(group.status)

  useEffect(() => {
    setCuratorId(group.curator?.id ?? "")
    setHeadId(group.head_student?.id ?? "")
    setStatus(group.status)
  }, [group])

  const changed =
    curatorId !== (group.curator?.id ?? "") || headId !== (group.head_student?.id ?? "") || status !== group.status
  const save = useAdminMutation({
    mutationFn: () =>
      patchAdminGroup(group.id, {
        ...(curatorId !== (group.curator?.id ?? "") ? { curator_id: curatorId || null } : {}),
        ...(headId !== (group.head_student?.id ?? "") ? { head_student_id: headId || null } : {}),
        ...(status !== group.status ? { status } : {}),
      }),
    invalidate: [keys.admin.groups.all(), keys.staff.groups.list()],
    success: t("saved"),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("people")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <LabeledField label={t("curator")} htmlFor="group-curator">
          <SelectField
            id="group-curator"
            value={curatorId}
            emptyLabel={t("none")}
            options={(teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) }))}
            onChange={setCuratorId}
          />
        </LabeledField>
        <LabeledField label={t("headStudent")} htmlFor="group-head">
          <SelectField
            id="group-head"
            value={headId}
            emptyLabel={t("none")}
            options={group.students
              .filter((student) => student.status === "active")
              .map((student) => ({ value: student.user_id, label: fullName(student) }))}
            onChange={setHeadId}
          />
        </LabeledField>
        <LabeledField label={t("status")} htmlFor="group-status">
          <SelectField
            id="group-status"
            value={status}
            options={[
              { value: "active", label: t("statusActive") },
              { value: "archived", label: t("statusArchived") },
            ]}
            onChange={(value) => setStatus(value === "archived" ? "archived" : "active")}
          />
        </LabeledField>
        <div className="flex items-end">
          <Button type="button" className={TOUCH} disabled={!changed || save.isPending} onClick={() => save.mutate()}>
            {t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
