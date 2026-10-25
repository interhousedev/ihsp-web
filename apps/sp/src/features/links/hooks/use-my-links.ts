"use client"

import { deleteLink, getMeLinks, keys, postLinkRevoke, postLinks, type LinkCreateBody, type LinkItem } from "@ihsp/api"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { LinkKindFilter } from "../utils/link-display"

const PAGE_SIZE = 50

/** All the student's links and shares, newest first; `kind` filters on the server. */
export function useMyLinks(kind: LinkKindFilter) {
  return useInfiniteQuery({
    queryKey: [...keys.me.links({ kind }), "pages"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getMeLinks({ cursor: pageParam, limit: PAGE_SIZE, ...(kind === "all" ? {} : { kind }) }, { signal }),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

function useRefreshLinks() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["me", "links"] })
    // The chat's "shared publicly" banner depends on the links.
    void queryClient.invalidateQueries({ queryKey: ["ai", "chats"] })
  }
}

export function useCreateLink() {
  const refresh = useRefreshLinks()
  return useMutation<LinkItem, unknown, LinkCreateBody>({
    mutationFn: (body) => postLinks(body),
    onSuccess: refresh,
  })
}

export function useRevokeLink() {
  const refresh = useRefreshLinks()
  return useMutation<LinkItem, unknown, string>({
    mutationFn: (id) => postLinkRevoke(id),
    onSuccess: refresh,
  })
}

export function useDeleteLink() {
  const refresh = useRefreshLinks()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteLink(id),
    onSuccess: refresh,
  })
}
