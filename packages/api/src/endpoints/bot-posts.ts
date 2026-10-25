// Telegram bot posts tree (role: admin). Backend contract: /v1/admin/posts.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  BotPost,
  BotPostCreate,
  BotPostMove,
  BotPostPatch,
  BotPostReorder,
  BotPostReorderResult,
  BotPostTreeNode,
} from "../types/bot-posts"

/** GET /v1/admin/posts/tree — admin; the whole tree from the root. The root is created on first use. */
export function getAdminBotPostTree(opts?: RequestOptions): Promise<BotPostTreeNode> {
  return api.get<BotPostTreeNode>("/v1/admin/posts/tree", opts)
}
export const getAdminBotPostTreeQuery = () =>
  queryOptions({
    queryKey: keys.admin.botPosts.tree(),
    queryFn: ({ signal }) => getAdminBotPostTree({ signal }),
  })

/** GET /v1/admin/posts/{id} — admin. */
export function getAdminBotPost(id: string, opts?: RequestOptions): Promise<BotPost> {
  return api.get<BotPost>(`/v1/admin/posts/${seg(id)}`, opts)
}

/** POST /v1/admin/posts — admin; 201 with the created post. */
export function postAdminBotPost(body: BotPostCreate, opts?: RequestOptions): Promise<BotPost> {
  return api.post<BotPost>("/v1/admin/posts", body, opts)
}

/** PATCH /v1/admin/posts/{id} — admin; the parent changes only through move. */
export function patchAdminBotPost(id: string, body: BotPostPatch, opts?: RequestOptions): Promise<BotPost> {
  return api.patch<BotPost>(`/v1/admin/posts/${seg(id)}`, body, opts)
}

/** DELETE /v1/admin/posts/{id}?cascade — admin; 204. 409 `posts/root-protected`, 409 `posts/has-children` without cascade. */
export function deleteAdminBotPost(id: string, cascade = false, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`/v1/admin/posts/${seg(id)}`, { ...opts, query: { cascade } })
}

/** POST /v1/admin/posts/reorder — admin; `ids` are exactly the children of `parent_id`. 422 `posts/reorder-mismatch`. */
export function postAdminBotPostsReorder(body: BotPostReorder, opts?: RequestOptions): Promise<BotPostReorderResult> {
  return api.post<BotPostReorderResult>("/v1/admin/posts/reorder", body, opts)
}

/** POST /v1/admin/posts/{id}/move — admin; appended to the end of the new parent. 422 `posts/cycle`. */
export function postAdminBotPostMove(id: string, body: BotPostMove, opts?: RequestOptions): Promise<BotPost> {
  return api.post<BotPost>(`/v1/admin/posts/${seg(id)}/move`, body, opts)
}
