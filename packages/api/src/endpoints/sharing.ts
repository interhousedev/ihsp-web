// Sharing notebooks and files. A person without a grant gets 404 from all of these.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type { FileUrlResponse } from "../types/files"
import type { NotebookDetail, NotebookItem } from "../types/notebooks"
import type {
  FileShares,
  LinkedSet,
  NotebookShares,
  ShareLink,
  ShareRecipient,
  SharedFile,
  SharedNotebook,
} from "../types/sharing"

/** GET /v1/notebooks/shared — the notebooks shared with the caller. */
export function getSharedNotebooks(opts?: RequestOptions): Promise<{ items: SharedNotebook[] }> {
  return api.get<{ items: SharedNotebook[] }>("/v1/notebooks/shared", opts)
}
export const getSharedNotebooksQuery = () =>
  queryOptions({ queryKey: keys.sharing.notebooks(), queryFn: ({ signal }) => getSharedNotebooks({ signal }) })

/** GET /v1/notebooks/share-recipients?q= — people by name, 3 letters at least. */
export function getShareRecipients(q: string, opts?: RequestOptions): Promise<{ items: ShareRecipient[] }> {
  return api.get<{ items: ShareRecipient[] }>("/v1/notebooks/share-recipients", { ...opts, query: { q } })
}

/** POST /v1/notebooks/shares/join — turn a link into the caller's grant. */
export function postJoinNotebook(token: string, opts?: RequestOptions): Promise<NotebookItem> {
  return api.post<NotebookItem>("/v1/notebooks/shares/join", { token }, opts)
}

/** GET /v1/notebooks/{id}/shares — owner only. */
export function getNotebookShares(id: string, opts?: RequestOptions): Promise<NotebookShares> {
  return api.get<NotebookShares>(`/v1/notebooks/${seg(id)}/shares`, opts)
}
export const getNotebookSharesQuery = (id: string) =>
  queryOptions({ queryKey: keys.sharing.notebook(id), queryFn: ({ signal }) => getNotebookShares(id, { signal }) })

/** POST /v1/notebooks/{id}/shares/link — create the link or replace its token. */
export function postNotebookShareLink(id: string, opts?: RequestOptions): Promise<ShareLink> {
  return api.post<ShareLink>(`/v1/notebooks/${seg(id)}/shares/link`, undefined, opts)
}

/** DELETE /v1/notebooks/{id}/shares/link — turn it off; people who joined through it lose access. */
export function deleteNotebookShareLink(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/shares/link`, opts)
}

/** PUT /v1/notebooks/{id}/shares/{user} — give a person access. */
export function putNotebookShare(id: string, userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.put<NoContent>(`/v1/notebooks/${seg(id)}/shares/${seg(userId)}`, undefined, opts)
}

/** DELETE /v1/notebooks/{id}/shares/{user} — revoke at once. */
export function deleteNotebookShare(id: string, userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/shares/${seg(userId)}`, opts)
}

/** DELETE /v1/notebooks/{id}/membership — a recipient removes the notebook and their chat. */
export function deleteNotebookMembership(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/membership`, opts)
}

/** POST /v1/notebooks/{id}/copy — a separate notebook; later changes do not reach it. */
export function postNotebookCopy(id: string, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.post<NotebookDetail>(`/v1/notebooks/${seg(id)}/copy`, undefined, opts)
}

/** GET /v1/notebooks/{id}/linked-sets — the live source sets attached to a notebook. */
export function getLinkedSets(id: string, opts?: RequestOptions): Promise<{ items: LinkedSet[] }> {
  return api.get<{ items: LinkedSet[] }>(`/v1/notebooks/${seg(id)}/linked-sets`, opts)
}
export const getLinkedSetsQuery = (id: string) =>
  queryOptions({ queryKey: keys.sharing.linkedSets(id), queryFn: ({ signal }) => getLinkedSets(id, { signal }) })

/** POST /v1/notebooks/{id}/linked-sets — attach a notebook the caller may read. */
export function postLinkedSet(id: string, notebookId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/notebooks/${seg(id)}/linked-sets`, { notebook_id: notebookId }, opts)
}

/** DELETE /v1/notebooks/{id}/linked-sets/{linked}. */
export function deleteLinkedSet(id: string, linkedId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/linked-sets/${seg(linkedId)}`, opts)
}

/** GET /v1/me/shared-files — the files shared with the caller. */
export function getSharedFiles(opts?: RequestOptions): Promise<{ items: SharedFile[] }> {
  return api.get<{ items: SharedFile[] }>("/v1/me/shared-files", opts)
}
export const getSharedFilesQuery = () =>
  queryOptions({ queryKey: keys.sharing.files(), queryFn: ({ signal }) => getSharedFiles({ signal }) })

/** GET /v1/files/shared/{id}/url — a presigned URL for a recipient, valid for 60 seconds. */
export function getSharedFileUrl(id: string, opts?: RequestOptions): Promise<FileUrlResponse> {
  return api.get<FileUrlResponse>(`/v1/files/shared/${seg(id)}/url`, opts)
}

/** DELETE /v1/files/shared/{id} — a recipient removes the file from their list. */
export function deleteSharedFile(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/files/shared/${seg(id)}`, opts)
}

/** POST /v1/files/shares/join — turn a link into the caller's grant. */
export function postJoinFile(token: string, opts?: RequestOptions): Promise<SharedFile> {
  return api.post<SharedFile>("/v1/files/shares/join", { token }, opts)
}

/** GET /v1/files/{id}/shares — owner only. */
export function getFileShares(id: string, opts?: RequestOptions): Promise<FileShares> {
  return api.get<FileShares>(`/v1/files/${seg(id)}/shares`, opts)
}
export const getFileSharesQuery = (id: string) =>
  queryOptions({ queryKey: keys.sharing.file(id), queryFn: ({ signal }) => getFileShares(id, { signal }) })

/** POST /v1/files/{id}/shares/link — create the link or replace its token. */
export function postFileShareLink(id: string, opts?: RequestOptions): Promise<ShareLink> {
  return api.post<ShareLink>(`/v1/files/${seg(id)}/shares/link`, undefined, opts)
}

/** DELETE /v1/files/{id}/shares/link — turn it off; people who joined through it lose access. */
export function deleteFileShareLink(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/files/${seg(id)}/shares/link`, opts)
}

/** PUT /v1/files/{id}/shares/{user} — give a person access. */
export function putFileShare(id: string, userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.put<NoContent>(`/v1/files/${seg(id)}/shares/${seg(userId)}`, undefined, opts)
}

/** DELETE /v1/files/{id}/shares/{user} — revoke at once. */
export function deleteFileShare(id: string, userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/files/${seg(id)}/shares/${seg(userId)}`, opts)
}
