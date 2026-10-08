// Files — presigned upload flow (see `../upload.ts` for `uploadFile`), metadata, URLs, quota.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { Page } from "../types/common"
import type {
  FileCreateBody,
  FileCreateResponse,
  FileDeleteResponse,
  FileItem,
  FileRenameBody,
  FileUrlParams,
  FileUrlResponse,
  MyFilesParams,
  StorageInfo,
} from "../types/files"

/** POST /v1/files — bearer; registers the file and returns the presigned `PUT` target. */
export function postFiles(body: FileCreateBody, opts?: RequestOptions): Promise<FileCreateResponse> {
  return api.post<FileCreateResponse>("/v1/files", body, opts)
}

/** POST /v1/files/{id}/complete — owner; verifies the upload. */
export function postFileComplete(id: string, opts?: RequestOptions): Promise<FileItem> {
  return api.post<FileItem>(`/v1/files/${seg(id)}/complete`, undefined, opts)
}

/** GET /v1/files/{id} — owner, or anyone allowed by `check_access`. */
export function getFile(id: string, opts?: RequestOptions): Promise<FileItem> {
  return api.get<FileItem>(`/v1/files/${seg(id)}`, opts)
}
export const getFileQuery = (id: string) =>
  queryOptions({ queryKey: keys.files.detail(id), queryFn: ({ signal }) => getFile(id, { signal }) })

/** GET /v1/files/{id}/url?disposition=inline|attachment — presigned URL valid for 60 seconds. */
export function getFileUrl(id: string, params?: FileUrlParams, opts?: RequestOptions): Promise<FileUrlResponse> {
  return api.get<FileUrlResponse>(`/v1/files/${seg(id)}/url`, { ...opts, query: params })
}
export const getFileUrlQuery = (id: string, params?: FileUrlParams) =>
  queryOptions({
    queryKey: keys.files.url(id, params?.disposition),
    queryFn: ({ signal }) => getFileUrl(id, params, { signal }),
  })

/** PATCH /v1/files/{id} — owner; rename. */
export function patchFile(id: string, body: FileRenameBody, opts?: RequestOptions): Promise<FileItem> {
  return api.patch<FileItem>(`/v1/files/${seg(id)}`, body, opts)
}

/** DELETE /v1/files/{id} — owner; returns where the file was used. */
export function deleteFile(id: string, opts?: RequestOptions): Promise<FileDeleteResponse> {
  return api.delete<FileDeleteResponse>(`/v1/files/${seg(id)}`, opts)
}

/** GET /v1/me/files?purpose&cursor — bearer. */
export function getMeFiles(params?: MyFilesParams, opts?: RequestOptions): Promise<Page<FileItem>> {
  return api.get<Page<FileItem>>("/v1/me/files", { ...opts, query: params })
}
export const getMeFilesQuery = (params?: MyFilesParams) =>
  queryOptions({
    queryKey: keys.me.files(params),
    queryFn: ({ signal }) => getMeFiles(params, { signal }),
  })

/** GET /v1/me/storage — bearer. */
export function getMeStorage(opts?: RequestOptions): Promise<StorageInfo> {
  return api.get<StorageInfo>("/v1/me/storage", opts)
}
export const getMeStorageQuery = () =>
  queryOptions({ queryKey: keys.me.storage(), queryFn: ({ signal }) => getMeStorage({ signal }) })
