"use client"

import {
  deleteFile,
  getMeFiles,
  getMeStorageQuery,
  keys,
  patchFile,
  postLinks,
  type FileDeleteResponse,
  type FileItem,
  type LinkItem,
  type MyFilesParams,
  type Page,
} from "@ihsp/api"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query"

const PAGE_SIZE = 50
const POLL_MS = 3000

function isChecking(file: FileItem): boolean {
  return file.status === "pending" || file.status === "processing"
}

function anyChecking(data: InfiniteData<Page<FileItem>> | undefined): boolean {
  return data?.pages.some((page) => page.items.some(isChecking)) ?? false
}

/** The server-side filters of My files: name search, file type and the purpose view (tab). */
export type MyFileFilters = Pick<MyFilesParams, "q" | "type" | "purpose">

/** My files, newest first, loaded page by page; files being checked refresh every 3 seconds. */
export function useMyFiles(filters: MyFileFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...keys.me.files(filters), "pages"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => getMeFiles({ ...filters, cursor: pageParam, limit: PAGE_SIZE }, { signal }),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    refetchInterval: (query) => (anyChecking(query.state.data) ? POLL_MS : false),
  })
}

export function useStorage() {
  return useQuery(getMeStorageQuery())
}

/** Refresh everything that shows files or the quota. */
export function useRefreshFiles() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["me", "files"] })
    void queryClient.invalidateQueries({ queryKey: keys.me.storage() })
  }
}

export function useRenameFile() {
  const refresh = useRefreshFiles()
  return useMutation<FileItem, unknown, { id: string; name: string }>({
    mutationFn: ({ id, name }) => patchFile(id, { name }),
    onSuccess: refresh,
  })
}

/** A short link to one of my files (`POST /v1/links`, kind `file`). */
export function useShareFile() {
  return useMutation<LinkItem, unknown, string>({
    mutationFn: (id) => postLinks({ kind: "file", file_id: id }),
  })
}

export function useDeleteFile() {
  const refresh = useRefreshFiles()
  return useMutation<FileDeleteResponse, unknown, string>({
    mutationFn: (id) => deleteFile(id),
    onSuccess: refresh,
  })
}
