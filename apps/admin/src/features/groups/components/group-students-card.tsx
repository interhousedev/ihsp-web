"use client"

import { keys, putAdminSubgroups, type GroupDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"

type Draft = Record<string, "" | "1" | "2">

function toValue(subgroup: 1 | 2 | null): "" | "1" | "2" {
  return subgroup === 1 ? "1" : subgroup === 2 ? "2" : ""
}

function toSubgroup(value: string): 1 | 2 | null {
  return value === "1" ? 1 : value === "2" ? 2 : null
}

/** Students of a group with a subgroup picker per student (the admin override of ACA-2); saved in one request. */
export function GroupStudentsCard({ group }: { group: GroupDetail }) {
  const t = useT("groups.view")
  const [draft, setDraft] = useState<Draft>({})
  const [draftFor, setDraftFor] = useState(group)
  // A new server version of the group (after saving) clears the unsaved choices.
  if (draftFor !== group) {
    setDraftFor(group)
    setDraft({})
  }

  const changes = group.students.filter((student) => {
    const value = draft[student.user_id]
    return value !== undefined && value !== toValue(student.subgroup)
  })

  const save = useAdminMutation({
    mutationFn: () =>
      putAdminSubgroups(group.id, {
        assignments: changes.map((student) => ({
          user_id: student.user_id,
          subgroup: toSubgroup(draft[student.user_id] ?? ""),
        })),
      }),
    invalidate: [keys.admin.groups.all(), keys.admin.students.all()],
    success: t("subgroupsSaved"),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>{t("students", { count: group.students.length })}</span>
          <Button
            type="button"
            className={TOUCH}
            disabled={changes.length === 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {t("saveSubgroups", { count: changes.length })}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {group.students.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noStudents")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("statusColumn")}</TableHead>
                  <TableHead>{t("registered")}</TableHead>
                  <TableHead className="w-44">{t("subgroup")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.students.map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell className="font-medium">
                      {student.registered ? (
                        <Link
                          href={`/students/view/?id=${encodeURIComponent(student.user_id)}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {fullName(student)}
                        </Link>
                      ) : (
                        fullName(student)
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.registered ? "secondary" : "outline"}>
                        {student.registered ? t("yes") : t("no")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SelectField
                        aria-label={t("subgroupOf", { name: fullName(student) })}
                        value={draft[student.user_id] ?? toValue(student.subgroup)}
                        emptyLabel={t("noSubgroup")}
                        options={[
                          { value: "1", label: t("subgroupNumber", { number: 1 }) },
                          { value: "2", label: t("subgroupNumber", { number: 2 }) },
                        ]}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            [student.user_id]: value === "1" ? "1" : value === "2" ? "2" : "",
                          }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
