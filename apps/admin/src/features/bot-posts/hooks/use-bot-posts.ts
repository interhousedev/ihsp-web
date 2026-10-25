"use client"

import {
  deleteAdminBotPost,
  getAdminBotPostTreeQuery,
  keys,
  patchAdminBotPost,
  postAdminBotPost,
  postAdminBotPostMove,
  postAdminBotPostsReorder,
  type BotPostCreate,
  type BotPostPatch,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

const TREE_KEY = keys.admin.botPosts.all()

/** The whole tree; the backend creates the root on first use. */
export function useBotPostTree() {
  return useQuery(getAdminBotPostTreeQuery())
}

/** Saves the fields of one post (PATCH). Errors stay inline; see botPostErrorMessage. */
export function useSaveBotPost() {
  const t = useT("botPosts")
  return useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: BotPostPatch }) => patchAdminBotPost(id, body),
    invalidate: [TREE_KEY],
    success: t("saved"),
    inlineError: true,
  })
}

export function useCreateBotPost() {
  const t = useT("botPosts")
  return useAdminMutation({
    mutationFn: (input: BotPostCreate) => postAdminBotPost(input),
    invalidate: [TREE_KEY],
    success: t("created"),
    inlineError: true,
  })
}

export function useDeleteBotPost() {
  const t = useT("botPosts")
  return useAdminMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: boolean }) => deleteAdminBotPost(id, cascade),
    invalidate: [TREE_KEY],
    success: t("deleted"),
    inlineError: true,
  })
}

/** Sets the order of the children of `parentId` (drag and drop within one level). */
export function useReorderBotPosts() {
  return useAdminMutation({
    mutationFn: ({ parentId, ids }: { parentId: string | null; ids: string[] }) =>
      postAdminBotPostsReorder({ parent_id: parentId, ids }),
    invalidate: [TREE_KEY],
    inlineError: true,
  })
}

export function useMoveBotPost() {
  const t = useT("botPosts")
  return useAdminMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      postAdminBotPostMove(id, { parent_id: parentId }),
    invalidate: [TREE_KEY],
    success: t("moved"),
    inlineError: true,
  })
}
