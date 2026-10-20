import type { AdminWorkOffItem, AdminWorkOffList, WorkOffGroupBy, WorkOffStats } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { adminWorkOffRecords, adminWorkOffStatsRows, type AdminWorkOffRecord } from "../fixtures/work-offs-admin"
import { apiUrl, query } from "./utils"

const GROUPS: readonly WorkOffGroupBy[] = ["subject", "teacher", "group", "student"]

function toItem(record: AdminWorkOffRecord): AdminWorkOffItem {
  const { subject_id: _subject, teacher_id: _teacher, group_id: _group, ...item } = record
  return item
}

/** `/v1/admin/work-offs/stats` (rows per `group_by`) and `/v1/admin/work-offs` (filters, status and paging). */
export const adminWorkOffsHandlers = [
  http.get(apiUrl("/v1/admin/work-offs/stats"), ({ request }) => {
    const search = query(request)
    const asked = search.get("group_by") as WorkOffGroupBy | null
    const groupBy = asked && GROUPS.includes(asked) ? asked : "subject"
    const rows = adminWorkOffStatsRows[groupBy]
    const body: WorkOffStats = {
      group_by: groupBy,
      from: search.get("from") ?? "2026-09-07",
      to: search.get("to") ?? "2026-10-07",
      total_open: rows.reduce((sum, row) => sum + row.open_count, 0),
      rows,
    }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/admin/work-offs"), ({ request }) => {
    const search = query(request)
    const status = search.get("status") ?? "open"
    const limit = Number(search.get("limit") ?? 50) || 50
    const offset = Number(search.get("offset") ?? 0) || 0
    const found = adminWorkOffRecords.filter(
      (r) =>
        (!search.get("subject_id") || r.subject_id === search.get("subject_id")) &&
        (!search.get("teacher_id") || r.teacher_id === search.get("teacher_id")) &&
        (!search.get("group_id") || r.group_id === search.get("group_id")) &&
        (!search.get("student_id") || r.student_id === search.get("student_id")) &&
        (status === "all" || (status === "done") === (r.status === "done")),
    )
    const body: AdminWorkOffList = { total: found.length, items: found.slice(offset, offset + limit).map(toItem) }
    return HttpResponse.json(body)
  }),
]
