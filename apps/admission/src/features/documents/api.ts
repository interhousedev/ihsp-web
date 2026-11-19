"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission"

export type DocumentVersion = { version: number; file_id: string; scan_status: string; uploaded_at: string | null }
export type DocumentAttachment = {
  id: string
  document_id: string
  document_version: number
  list_entry_id: string
  status: string
}

export type AdmissionDocument = {
  id: string
  student_id: string
  kind: string
  visibility: string
  current_version: number
  review_status: "none" | "accepted" | "rejected"
  reject_reason_code: string | null
  reject_note: string | null
  created_at: string | null
  versions: DocumentVersion[]
  attachments: DocumentAttachment[]
  can_download: boolean
}

export type ChecklistItem = {
  id: string
  template_key: string
  title_key: string
  list_entry_id: string | null
  owner: string
  status: string
  due_utc: string | null
  document_id: string | null
  source_url: string | null
  important: boolean
  urgent_override: boolean | null
  institution_name?: string | null
  logo_url?: string | null
  logo_fit?: "circle" | "contain"
  logo_zoom?: number
  app_path: string | null
  urgent: boolean
  quadrant: "do" | "schedule" | "delegate" | "drop"
}

export type ChecklistPatch = {
  status?: string
  document_id?: string | null
  important?: boolean
  urgent_override?: boolean | null
  source_url?: string | null
}

export const DOCUMENTS_KEY = ["admission", "documents"] as const
export const CHECKLIST_KEY = ["admission", "checklist"] as const
export const STAFF_DOCUMENTS_KEY = ["admission", "staff-documents"] as const

export function uploadDocument(kind: string, file: File): Promise<AdmissionDocument> {
  const formData = new FormData()
  formData.append("kind", kind)
  formData.append("file", file)
  return getApiClient().request<AdmissionDocument>({ method: "POST", path: `${BASE}/documents`, formData })
}

export function uploadDocumentVersion(id: string, file: File): Promise<AdmissionDocument> {
  const formData = new FormData()
  formData.append("file", file)
  return getApiClient().request<AdmissionDocument>({
    method: "POST",
    path: `${BASE}/documents/${encodeURIComponent(id)}/versions`,
    formData,
  })
}

export function downloadDocument(id: string): Promise<{ url: string; expires_at: string }> {
  return getApiClient().post(`${BASE}/documents/${encodeURIComponent(id)}/download`)
}

export type ReviewBody = { accept: boolean; reason_code?: string | null; note?: string | null }

export function reviewDocument(id: string, body: ReviewBody): Promise<AdmissionDocument> {
  return getApiClient().post(`${BASE}/documents/${encodeURIComponent(id)}/review`, body)
}

export function attachDocument(id: string, listEntryId: string) {
  return getApiClient().post<DocumentAttachment>(`${BASE}/documents/${encodeURIComponent(id)}/attachments`, {
    list_entry_id: listEntryId,
  })
}

export function patchChecklistItem(id: string, body: ChecklistPatch) {
  return getApiClient().patch<ChecklistItem>(`${BASE}/checklist/${encodeURIComponent(id)}`, body)
}

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: () => getApiClient().get<AdmissionDocument[]>(`${BASE}/documents`),
  })
}

export function useStudentChecklist(studentId: string) {
  return useQuery({
    queryKey: [...CHECKLIST_KEY, studentId],
    queryFn: () => getApiClient().get<ChecklistItem[]>(`${BASE}/checklist?student_id=${encodeURIComponent(studentId)}`),
  })
}

export function useChecklist() {
  return useQuery({
    queryKey: CHECKLIST_KEY,
    queryFn: () => getApiClient().get<ChecklistItem[]>(`${BASE}/checklist`),
  })
}

export function useStaffDocuments(reviewStatus: string | null) {
  return useQuery({
    queryKey: [...STAFF_DOCUMENTS_KEY, reviewStatus],
    queryFn: () =>
      getApiClient().get<AdmissionDocument[]>(`${BASE}/staff/documents`, {
        query: { review_status: reviewStatus },
      }),
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ["admission"] })
}

export function useUploadDocument() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ kind, file }: { kind: string; file: File }) => uploadDocument(kind, file),
    onSuccess: invalidate,
  })
}

export function useUploadVersion() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadDocumentVersion(id, file),
    onSuccess: invalidate,
  })
}

export function useReviewDocument() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: ReviewBody & { id: string }) => reviewDocument(id, body),
    onSuccess: invalidate,
  })
}

export function usePatchChecklist() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ChecklistPatch) => patchChecklistItem(id, body),
    onSuccess: invalidate,
  })
}
