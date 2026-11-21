"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Pill } from "@ihsp/ui"
import Link from "next/link"
import { DataTable, type DataColumn } from "../../../components/lib/page"
import type { CaseloadItem } from "../api"
import { AssignDialog } from "./assign-dialog"

/** One row per student; `limited` marks a student the caller sees only partly. */
export function CaseloadList({
  items,
  stageLabel,
  canAssign = false,
}: {
  items: CaseloadItem[]
  stageLabel: (stage: string) => string
  canAssign?: boolean
}) {
  const t = useT("staff")
  const columns: DataColumn<CaseloadItem>[] = [
    {
      key: "student",
      header: t("caseload.columns.student"),
      cell: (item) => (
        <Link
          href={`/staff/students/view/?id=${item.student_id}`}
          className="hover:text-primary block truncate font-medium"
        >
          {item.student_name ?? t("caseload.student", { id: item.student_id.slice(0, 8) })} ·{" "}
          {item.group_name ?? t("caseload.noGroup")}
        </Link>
      ),
    },
    {
      key: "stage",
      header: t("caseload.columns.stage"),
      className: "hidden md:table-cell",
      cell: (item) => (item.stage ? <Pill tone="primary">{stageLabel(item.stage)}</Pill> : null),
    },
    {
      key: "due",
      header: t("caseload.columns.due"),
      className: "text-muted-foreground hidden md:table-cell",
      cell: (item) => (item.next_due ? formatDate(item.next_due) : t("caseload.noDeadline")),
    },
    {
      key: "staff",
      header: t("scope.assigned"),
      className: "hidden lg:table-cell",
      cell: (item) =>
        item.assigned_staff.length === 0 ? (
          <span className="text-muted-foreground">{t("scope.noneAssigned")}</span>
        ) : (
          <span className="text-sm">{item.assigned_staff.map((a) => a.name).join(", ")}</span>
        ),
    },
    {
      key: "status",
      header: t("caseload.columns.status"),
      cell: (item) => (
        <div className="flex flex-wrap gap-2">
          {item.overdue > 0 ? <Pill tone="danger">{t("caseload.overdue", { count: item.overdue })}</Pill> : null}
          {item.open_help > 0 ? <Pill tone="warning">{t("caseload.help", { count: item.open_help })}</Pill> : null}
          {item.limited ? <Pill>{t("caseload.limited")}</Pill> : null}
        </div>
      ),
    },
    ...(canAssign
      ? [
          {
            key: "actions",
            header: <span className="sr-only">{t("scope.actions")}</span>,
            cell: (item: CaseloadItem) => (
              <AssignDialog studentId={item.student_id} current={item.assigned_staff} compact />
            ),
          },
        ]
      : []),
  ]
  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(item) => item.student_id}
      label={t("caseload.listLabel")}
      className="max-h-[calc(100dvh-22rem)] overflow-y-auto"
    />
  )
}
