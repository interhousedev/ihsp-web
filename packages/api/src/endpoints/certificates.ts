// Student certificates (`/v1/certificates`): types, the student's own entries and files, staff views and the ZIP export.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  CertificateEntry,
  CertificateEntryInput,
  CertificateExportBody,
  CertificateFile,
  CertificateFilters,
  CertificateGroup,
  CertificateImportResult,
  CertificateRanking,
  CertificateStats,
  CertificateType,
  CertificateTypeInput,
  StaffCertificatePage,
  StaffCertificateParams,
} from "../types/certificates"
import type { NoContent } from "../types/common"

/** GET /v1/certificates/types — any signed-in user. */
export function getCertificateTypes(opts?: RequestOptions): Promise<CertificateType[]> {
  return api.get<CertificateType[]>(`/v1/certificates/types`, opts)
}
export const getCertificateTypesQuery = () =>
  queryOptions({
    queryKey: keys.certificates.types(),
    queryFn: ({ signal }) => getCertificateTypes({ signal }),
  })

/** POST /v1/certificates/admin/types — admin. */
export function postCertificateType(body: CertificateTypeInput, opts?: RequestOptions): Promise<CertificateType> {
  return api.post<CertificateType>(`/v1/certificates/admin/types`, body, opts)
}

/** PATCH /v1/certificates/admin/types/{id} — admin; a built-in type keeps its code. */
export function patchCertificateType(
  id: string,
  body: Partial<CertificateTypeInput>,
  opts?: RequestOptions,
): Promise<CertificateType> {
  return api.patch<CertificateType>(`/v1/certificates/admin/types/${seg(id)}`, body, opts)
}

/** DELETE /v1/certificates/admin/types/{id} — admin; `409 certificate_type_builtin` or `certificate_type_in_use`. */
export function deleteCertificateType(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/certificates/admin/types/${seg(id)}`, opts)
}

/** GET /v1/certificates/me — the student's entries. */
export function getMyCertificates(opts?: RequestOptions): Promise<CertificateEntry[]> {
  return api.get<CertificateEntry[]>(`/v1/certificates/me`, opts)
}
export const getMyCertificatesQuery = () =>
  queryOptions({
    queryKey: keys.certificates.mine(),
    queryFn: ({ signal }) => getMyCertificates({ signal }),
  })

/** POST /v1/certificates/me — `422` when the level is not one of the type's levels. */
export function postMyCertificate(body: CertificateEntryInput, opts?: RequestOptions): Promise<CertificateEntry> {
  return api.post<CertificateEntry>(`/v1/certificates/me`, body, opts)
}

/** PATCH /v1/certificates/me/{entry_id}. */
export function patchMyCertificate(
  entryId: string,
  body: Partial<CertificateEntryInput>,
  opts?: RequestOptions,
): Promise<CertificateEntry> {
  return api.patch<CertificateEntry>(`/v1/certificates/me/${seg(entryId)}`, body, opts)
}

/** DELETE /v1/certificates/me/{entry_id} — removes the entry and its files. */
export function deleteMyCertificate(entryId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/certificates/me/${seg(entryId)}`, opts)
}

/** POST /v1/certificates/me/{entry_id}/files — multipart `file` (.png .jpg .jpeg .pdf .docx); `413` quota or size, `415` type. */
export function postMyCertificateFile(entryId: string, file: File, opts?: RequestOptions): Promise<CertificateFile> {
  const form = new FormData()
  form.append("file", file)
  return api.request<CertificateFile>({
    ...opts,
    method: "POST",
    path: `/v1/certificates/me/${seg(entryId)}/files`,
    formData: form,
  })
}

/** DELETE /v1/certificates/me/{entry_id}/files/{file_id}. */
export function deleteMyCertificateFile(entryId: string, fileId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/certificates/me/${seg(entryId)}/files/${seg(fileId)}`, opts)
}

/** GET /v1/certificates/files/{file_id}/download — the backend redirects to a presigned URL; the body is the file. */
export function getCertificateFileBlob(fileId: string, opts?: RequestOptions): Promise<Blob> {
  return api.request<Blob>({
    ...opts,
    method: "GET",
    path: `/v1/certificates/files/${seg(fileId)}/download`,
    responseType: "blob",
  })
}

/** POST /v1/certificates/me/import-emis — pulls the National Certificate and CEFR from EMIS. */
export function postImportCertificatesFromEmis(opts?: RequestOptions): Promise<CertificateImportResult> {
  return api.post<CertificateImportResult>(`/v1/certificates/me/import-emis`, {}, opts)
}

/** GET /v1/certificates/staff/groups — the groups the caller may see (admin: all, curator: their own, else `403`). */
export function getCertificateGroups(opts?: RequestOptions): Promise<CertificateGroup[]> {
  return api.get<CertificateGroup[]>(`/v1/certificates/staff/groups`, opts)
}
export const getCertificateGroupsQuery = () =>
  queryOptions({
    queryKey: keys.certificates.groups(),
    queryFn: ({ signal }) => getCertificateGroups({ signal }),
  })

/** GET /v1/certificates/staff/entries?filters&limit&offset. */
export function getStaffCertificates(
  params?: StaffCertificateParams,
  opts?: RequestOptions,
): Promise<StaffCertificatePage> {
  return api.get<StaffCertificatePage>(`/v1/certificates/staff/entries`, { ...opts, query: params })
}
export const getStaffCertificatesQuery = (params?: StaffCertificateParams) =>
  queryOptions({
    queryKey: keys.certificates.entries(params),
    queryFn: ({ signal }) => getStaffCertificates(params, { signal }),
  })

/** GET /v1/certificates/staff/stats?filters. */
export function getCertificateStats(params?: CertificateFilters, opts?: RequestOptions): Promise<CertificateStats> {
  return api.get<CertificateStats>(`/v1/certificates/staff/stats`, { ...opts, query: params })
}
export const getCertificateStatsQuery = (params?: CertificateFilters) =>
  queryOptions({
    queryKey: keys.certificates.stats(params),
    queryFn: ({ signal }) => getCertificateStats(params, { signal }),
  })

/** GET /v1/certificates/staff/ranking?filters&limit. */
export function getCertificateRanking(
  params?: CertificateFilters & { limit?: number },
  opts?: RequestOptions,
): Promise<CertificateRanking> {
  return api.get<CertificateRanking>(`/v1/certificates/staff/ranking`, { ...opts, query: params })
}
export const getCertificateRankingQuery = (params?: CertificateFilters & { limit?: number }) =>
  queryOptions({
    queryKey: keys.certificates.ranking(params),
    queryFn: ({ signal }) => getCertificateRanking(params, { signal }),
  })

/** POST /v1/certificates/staff/export — a ZIP of the chosen files (`file_ids`) or of everything the filters match. */
export function postCertificateExport(body: CertificateExportBody, opts?: RequestOptions): Promise<Blob> {
  return api.request<Blob>({
    ...opts,
    method: "POST",
    path: `/v1/certificates/staff/export`,
    body,
    responseType: "blob",
  })
}
