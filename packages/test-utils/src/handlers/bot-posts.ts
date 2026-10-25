import type { BotPost, BotPostCreate, BotPostMove, BotPostPatch, BotPostReorder } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { botPostList, botPostTree } from "../fixtures/bot-posts"
import { apiUrl, noContent, notFound, problem, query, readJson, param } from "./utils"

function findPost(id: string): BotPost | undefined {
  return botPostList.find((post) => post.id === id)
}

/** Telegram bot posts tree (`/v1/admin/posts*`). `tree` is declared before `:id` so it is not taken for an id. */
export const botPostsHandlers = [
  http.get(apiUrl("/v1/admin/posts/tree"), () => HttpResponse.json(botPostTree)),
  http.post(apiUrl("/v1/admin/posts/reorder"), async ({ request }) => {
    const body = await readJson<BotPostReorder>(request)
    const siblings = botPostList.filter((post) => post.parent_id === (body.parent_id ?? null))
    const ids = body.ids ?? []
    const matches = ids.length === siblings.length && siblings.every((post) => ids.includes(post.id))
    if (!matches) return problem(422, "posts/reorder-mismatch", "The ids are not the children of the parent")
    const items = ids.map((id) => findPost(id)).filter((post): post is BotPost => post !== undefined)
    return HttpResponse.json({ items })
  }),
  http.post(apiUrl("/v1/admin/posts/:id/move"), async ({ request, params }) => {
    const post = findPost(param(params, "id"))
    if (!post) return notFound("Post")
    const body = await readJson<BotPostMove>(request)
    return HttpResponse.json({ ...post, parent_id: body.parent_id ?? null })
  }),
  http.post(apiUrl("/v1/admin/posts"), async ({ request }) => {
    const body = await readJson<BotPostCreate>(request)
    const created: BotPost = {
      id: "post-new",
      parent_id: body.parent_id ?? botPostList[0]?.id ?? null,
      slug: body.slug ?? "new-post",
      title: body.title ?? {},
      body: body.body ?? {},
      audience: body.audience ?? "both",
      sort_order: body.sort_order ?? 0,
      published: body.published ?? false,
      is_root: false,
      buttons: body.buttons ?? [],
    }
    return HttpResponse.json(created, { status: 201 })
  }),
  http.get(apiUrl("/v1/admin/posts/:id"), ({ params }) => {
    const post = findPost(param(params, "id"))
    return post ? HttpResponse.json(post) : notFound("Post")
  }),
  http.patch(apiUrl("/v1/admin/posts/:id"), async ({ request, params }) => {
    const post = findPost(param(params, "id"))
    if (!post) return notFound("Post")
    const patch = await readJson<BotPostPatch>(request)
    return HttpResponse.json({ ...post, ...patch })
  }),
  http.delete(apiUrl("/v1/admin/posts/:id"), ({ request, params }) => {
    const post = findPost(param(params, "id"))
    if (!post) return notFound("Post")
    if (post.is_root) return problem(409, "posts/root-protected", "The root post cannot be deleted")
    const hasChildren = botPostList.some((child) => child.parent_id === post.id)
    if (hasChildren && query(request).get("cascade") !== "true") {
      return problem(409, "posts/has-children", "The post has children")
    }
    return noContent()
  }),
]
