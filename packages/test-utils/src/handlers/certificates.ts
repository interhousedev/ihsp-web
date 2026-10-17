import type {
  CertificateEntry,
  CertificateEntryInput,
  CertificateFilters,
  CertificateRankingItem,
  CertificateStats,
  CertificateType,
  CertificateTypeInput,
  StaffCertificateEntry,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  certificateEntries,
  certificateGroups,
  certificateTypes,
  staffCertificateEntries,
} from "../fixtures/certificates"
import { apiUrl, nextId, noContent, notFound, param, problem, query, readJson } from "./utils"

let types: CertificateType[] = structuredClone(certificateTypes)
let mine: CertificateEntry[] = structuredClone(certificateEntries)
let emisImported = false
/** Set to make every staff route answer 403, like a teacher who curates no group. */
let staffForbidden = false

export function resetCertificatesState(): void {
  types = structuredClone(certificateTypes)
  mine = structuredClone(certificateEntries)
  emisImported = false
  staffForbidden = false
}

/** Makes the staff routes answer `403 common/forbidden` (a teacher without a curated group). */
export function setCertificatesStaffForbidden(value: boolean): void {
  staffForbidden = value
}

const forbidden = () => problem(403, "common/forbidden", "Forbidden")

function filtered(request: Request): StaffCertificateEntry[] {
  const search = query(request)
  const get = (key: keyof CertificateFilters) => search.get(key)
  const q = get("q")?.toLowerCase()
  return staffCertificateEntries.filter(
    (e) =>
      (!get("group_id") || e.student.group_id === get("group_id")) &&
      (!get("subgroup") || e.student.subgroup === get("subgroup")) &&
      (!get("type_id") || e.type_id === get("type_id")) &&
      (!get("subject") || e.subject === get("subject")) &&
      (!get("level") || e.level === get("level")) &&
      (!get("student_id") || e.student.id === get("student_id")) &&
      (!q || e.student.name.toLowerCase().includes(q)),
  )
}

function statsOf(entries: StaffCertificateEntry[]): CertificateStats {
  return {
    types: types
      .filter((type) => entries.some((e) => e.type_id === type.id))
      .map((type) => {
        const groups = new Map<string, { group_id: string; group_name: string; counts: Record<string, number> }>()
        for (const e of entries.filter((item) => item.type_id === type.id)) {
          const gid = e.student.group_id ?? ""
          const group = groups.get(gid) ?? { group_id: gid, group_name: e.student.group_name ?? "", counts: {} }
          const level = e.level ?? "—"
          group.counts[level] = (group.counts[level] ?? 0) + 1
          groups.set(gid, group)
        }
        return { type_id: type.id, levels: type.levels.length ? type.levels : ["—"], groups: [...groups.values()] }
      }),
  }
}

function rankingOf(entries: StaffCertificateEntry[]): CertificateRankingItem[] {
  const byStudent = new Map<string, CertificateRankingItem>()
  for (const e of entries) {
    const item = byStudent.get(e.student.id) ?? {
      student_id: e.student.id,
      name: e.student.name,
      group_name: e.student.group_name,
      count: 0,
    }
    item.count += 1
    byStudent.set(e.student.id, item)
  }
  return [...byStudent.values()].toSorted((a, b) => b.count - a.count)
}

export const certificatesHandlers = [
  http.get(apiUrl("/v1/certificates/types"), () => HttpResponse.json(types)),
  http.post(apiUrl("/v1/certificates/admin/types"), async ({ request }) => {
    const body = await readJson<CertificateTypeInput>(request)
    const created = { ...body, id: nextId(90), builtin: false } as CertificateType
    types = [...types, created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.patch(apiUrl("/v1/certificates/admin/types/:id"), async ({ request, params }) => {
    const current = types.find((t) => t.id === param(params, "id"))
    if (!current) return notFound("Certificate type")
    const body = await readJson<CertificateTypeInput>(request)
    const updated: CertificateType = { ...current, ...body, id: current.id, builtin: current.builtin }
    if (current.builtin) updated.code = current.code
    types = types.map((t) => (t.id === current.id ? updated : t))
    return HttpResponse.json(updated)
  }),
  http.delete(apiUrl("/v1/certificates/admin/types/:id"), ({ params }) => {
    const current = types.find((t) => t.id === param(params, "id"))
    if (!current) return notFound("Certificate type")
    if (current.builtin) return problem(409, "certificate_type_builtin", "Built-in type")
    if (mine.some((e) => e.type_id === current.id)) return problem(409, "certificate_type_in_use", "Type in use")
    types = types.filter((t) => t.id !== current.id)
    return noContent()
  }),
  http.get(apiUrl("/v1/certificates/me"), () => HttpResponse.json(mine)),
  http.post(apiUrl("/v1/certificates/me/import-emis"), () => {
    emisImported = true
    return HttpResponse.json({ created: 2, updated: 1, files: 3, skipped: 0 })
  }),
  http.post(apiUrl("/v1/certificates/me"), async ({ request }) => {
    const body = await readJson<CertificateEntryInput>(request)
    const type = types.find((t) => t.id === body.type_id)
    if (!type) return notFound("Certificate type")
    if (body.level && !type.levels.includes(body.level)) {
      return problem(422, "common/validation-error", "Invalid level")
    }
    const entry: CertificateEntry = {
      id: nextId(91),
      type_id: type.id,
      level: body.level ?? null,
      score: body.score ?? null,
      percent: body.percent ?? null,
      subject: body.subject ?? null,
      year: body.year ?? null,
      serial: body.serial ?? null,
      source: "manual",
      issued_at: null,
      expires_at: null,
      files: [],
      created_at: "2026-10-07T05:12:00Z",
    }
    mine = [...mine, entry]
    return HttpResponse.json(entry, { status: 201 })
  }),
  http.patch(apiUrl("/v1/certificates/me/:entryId"), async ({ request, params }) => {
    const current = mine.find((e) => e.id === param(params, "entryId"))
    if (!current) return notFound("Certificate")
    const updated = { ...current, ...(await readJson<CertificateEntryInput>(request)) } as CertificateEntry
    mine = mine.map((e) => (e.id === current.id ? updated : e))
    return HttpResponse.json(updated)
  }),
  http.delete(apiUrl("/v1/certificates/me/:entryId"), ({ params }) => {
    mine = mine.filter((e) => e.id !== param(params, "entryId"))
    return noContent()
  }),
  http.post(apiUrl("/v1/certificates/me/:entryId/files"), async ({ request, params }) => {
    const current = mine.find((e) => e.id === param(params, "entryId"))
    if (!current) return notFound("Certificate")
    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) return problem(422, "common/validation-error", "No file")
    const created = { id: nextId(92), name: file.name, size: file.size, content_type: file.type }
    mine = mine.map((e) => (e.id === current.id ? { ...e, files: [...e.files, created] } : e))
    return HttpResponse.json(created, { status: 201 })
  }),
  http.delete(apiUrl("/v1/certificates/me/:entryId/files/:fileId"), ({ params }) => {
    mine = mine.map((e) =>
      e.id === param(params, "entryId") ? { ...e, files: e.files.filter((f) => f.id !== param(params, "fileId")) } : e,
    )
    return noContent()
  }),
  http.get(apiUrl("/v1/certificates/files/:fileId/download"), () => new HttpResponse("file", { status: 200 })),
  http.get(apiUrl("/v1/certificates/staff/groups"), () =>
    staffForbidden ? forbidden() : HttpResponse.json(certificateGroups),
  ),
  http.get(apiUrl("/v1/certificates/staff/entries"), ({ request }) => {
    if (staffForbidden) return forbidden()
    const items = filtered(request)
    const search = query(request)
    const offset = Number(search.get("offset") ?? 0)
    const limit = Number(search.get("limit") ?? 50)
    return HttpResponse.json({ items: items.slice(offset, offset + limit), total: items.length })
  }),
  http.get(apiUrl("/v1/certificates/staff/stats"), ({ request }) =>
    staffForbidden ? forbidden() : HttpResponse.json(statsOf(filtered(request))),
  ),
  http.get(apiUrl("/v1/certificates/staff/ranking"), ({ request }) =>
    staffForbidden ? forbidden() : HttpResponse.json({ items: rankingOf(filtered(request)) }),
  ),
  http.post(apiUrl("/v1/certificates/staff/export"), () =>
    staffForbidden
      ? forbidden()
      : new HttpResponse(new Blob(["zip"]), { headers: { "Content-Type": "application/zip" } }),
  ),
]

/** True after the student imported from EMIS (for tests). */
export function certificatesImported(): boolean {
  return emisImported
}
