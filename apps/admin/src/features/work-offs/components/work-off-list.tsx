"use client"

import {
  getAdminWorkOffsQuery,
  type AdminWorkOffsParams,
  type AdminWorkOffStatus,
  type WorkOffGroupBy,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { TOUCH } from "../../shared/utils/touch"

const PAGE_SIZE = 20
const STATUSES: readonly AdminWorkOffStatus[] = ["open", "done", "all"]
const ID_PARAM = {
  subject: "subject_id",
  teacher: "teacher_id",
  group: "group_id",
  student: "student_id",
} as const satisfies Record<WorkOffGroupBy, keyof AdminWorkOffsParams>

/** The work-offs of one subject, teacher, group or student, with a status filter and paging. */
export function WorkOffList({
  by,
  id,
  name,
  from,
  to,
  status,
  page,
  onStatus,
  onPage,
  onBack,
}: {
  by: WorkOffGroupBy
  id: string
  name: string
  from: string
  to: string
  status: AdminWorkOffStatus
  page: number
  onStatus: (status: AdminWorkOffStatus) => void
  onPage: (page: number) => void
  onBack: () => void
}) {
  const t = useT("workOffs")
  const f = useFormatters()
  const params: AdminWorkOffsParams = {
    from,
    to,
    [ID_PARAM[by]]: id,
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }
  const query = useQuery({ ...getAdminWorkOffsQuery(params), placeholderData: (previous) => previous })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" className={TOUCH} onClick={onBack}>
          {t("back")}
        </Button>
        <h2 className="text-lg font-medium">{name}</h2>
        <div role="group" aria-label={t("status")} className="ms-auto flex gap-1">
          {STATUSES.map((value) => (
            <Button
              key={value}
              type="button"
              variant={status === value ? "default" : "outline"}
              aria-pressed={status === value}
              className={TOUCH}
              onClick={() => onStatus(value)}
            >
              {t(`statuses.${value}`)}
            </Button>
          ))}
        </div>
      </div>
      <QueryState query={query} rows={4} isEmpty={(list) => list.total === 0} emptyText={t("emptyList")}>
        {(list) => (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.lesson")}</TableHead>
                    <TableHead>{t("columns.subject")}</TableHead>
                    <TableHead>{t("columns.teacher")}</TableHead>
                    <TableHead>{t("columns.group")}</TableHead>
                    <TableHead>{t("columns.student")}</TableHead>
                    <TableHead>{t("columns.text")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.due")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{t("lesson", { date: f.date(item.date), period: item.period })}</TableCell>
                      <TableCell>{item.subject_name}</TableCell>
                      <TableCell>{item.teacher_name ?? "—"}</TableCell>
                      <TableCell>{item.group_name ?? "—"}</TableCell>
                      <TableCell>{item.student_name}</TableCell>
                      <TableCell className="max-w-72 whitespace-normal">{item.text}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "done" ? "secondary" : "outline"}>
                          {t(`itemStatus.${item.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.due_date ? f.date(item.due_date) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" className={TOUCH} disabled={page <= 1} onClick={() => onPage(page - 1)}>
                {t("prev")}
              </Button>
              <span className="text-muted-foreground text-sm">
                {t("page", { page, pages: Math.max(1, Math.ceil(list.total / PAGE_SIZE)) })}
              </span>
              <Button
                variant="outline"
                className={TOUCH}
                disabled={page * PAGE_SIZE >= list.total}
                onClick={() => onPage(page + 1)}
              >
                {t("next")}
              </Button>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
